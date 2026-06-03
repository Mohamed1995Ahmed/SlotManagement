using NodaTime;
using NodaTime.Text;
using SlotBooking.Slots;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace SlotBooking.Slots;

public class SlotsAppService : ApplicationService, ISlotsAppService
{
    private readonly ISlotRepository _slotRepository;
    private readonly ISlotGenerator _slotGenerator;

    public SlotsAppService(
        ISlotRepository slotRepository,
        ISlotGenerator slotGenerator)
    {
        _slotRepository = slotRepository;
        _slotGenerator = slotGenerator;
    }

    // ── Generate ──────────────────────────────────────────────────────────────

    public async Task<GenerateSlotsResultDto> GenerateAsync(GenerateSlotsInput input)
    {
        ValidateGenerateInput(input);

        var requestedStart = LocalDatePattern.Iso.Parse(input.StartDate).Value;
        var endDate        = LocalDatePattern.Iso.Parse(input.EndDate).Value;
        var timeZone       = DateTimeZoneProviders.Tzdb[input.TimeZone];

        // Determine "today" in the requested time zone
        var nowInstant = SystemClock.Instance.GetCurrentInstant();
        var today      = nowInstant.InZone(timeZone).Date;

        // Both start AND end are in the past → reject
        if (endDate < today)
            throw new BusinessException("SlotBooking:DateRangeEntirelyInPast")
                .WithData("EndDate", input.EndDate)
                .WithData("Today",   today.ToString());

        // Start is in the past but end is today or future → clamp start to today
        string? adjustedStartDateStr = null;
        var effectiveStart = requestedStart;

        if (requestedStart < today)
        {
            effectiveStart       = today;
            adjustedStartDateStr = today.ToString(); // "YYYY-MM-DD"
        }

        var slots = _slotGenerator.Generate(
            effectiveStart, endDate, timeZone, input.SlotDuration, input.TimeZone);

        await _slotRepository.InsertManyAsync(slots, autoSave: true);

        return new GenerateSlotsResultDto
        {
            TotalSlotsCreated = slots.Count,
            AdjustedStartDate = adjustedStartDateStr
        };
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    public async Task<PagedResultDto<SlotDto>> GetNextAvailableAsync(GetNextAvailableSlotsInput input)
    {
        ValidateTimeZone(input.TimeZone);

        var timeZone = DateTimeZoneProviders.Tzdb[input.TimeZone];
        var now      = SystemClock.Instance.GetCurrentInstant();

        var queryable = await _slotRepository.GetQueryableAsync();

        // ── Status filter ────────────────────────────────────────────────────
        var status = ParseStatusFilter(input.StatusFilter);
        var q = status.HasValue
            ? queryable.Where(x => x.Status == status.Value)
            : queryable; // "all" — no status restriction

        // Future-only when viewing "available" or no filter (default behaviour)
        if (!status.HasValue || status == SlotStatus.Available)
            q = q.Where(x => x.StartInstant > now);

        // ── Date range filter (interpreted in the requested time zone) ────────
        if (!string.IsNullOrWhiteSpace(input.DateFrom))
        {
            var fromDate    = LocalDatePattern.Iso.Parse(input.DateFrom).Value;
            var fromInstant = fromDate.AtStartOfDayInZone(timeZone).ToInstant();
            q = q.Where(x => x.StartInstant >= fromInstant);
        }

        if (!string.IsNullOrWhiteSpace(input.DateTo))
        {
            var toDate    = LocalDatePattern.Iso.Parse(input.DateTo).Value;
            // include the whole last day
            var toInstant = toDate.PlusDays(1).AtStartOfDayInZone(timeZone).ToInstant();
            q = q.Where(x => x.StartInstant < toInstant);
        }

        q = q.OrderBy(x => x.StartInstant);

        var totalCount = q.Count();

        var items = q
            .Skip(input.Page * input.PageSize)
            .Take(input.PageSize)
            .ToList();

        var dtos = items
            .Select(slot => MapToDto(slot, timeZone, now, input.TimeZone))
            .ToList();

        return new PagedResultDto<SlotDto>(totalCount, dtos);
    }

    // ── Book ──────────────────────────────────────────────────────────────────

    public async Task BookAsync(Guid id)
    {
        var slot = await _slotRepository.GetAsync(id);
        if (slot.Status == SlotStatus.Booked)
            throw new BusinessException("SlotBooking:SlotAlreadyBooked").WithData("SlotId", id);

        slot.Book();
        await _slotRepository.UpdateAsync(slot, autoSave: true);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static SlotStatus? ParseStatusFilter(string? filter) =>
        filter?.ToLowerInvariant() switch
        {
            "available" => SlotStatus.Available,
            "booked"    => SlotStatus.Booked,
            _           => null
        };

    private static void ValidateGenerateInput(GenerateSlotsInput input)
    {
        ValidateTimeZone(input.TimeZone);

        if (!LocalDatePattern.Iso.Parse(input.StartDate).Success)
            throw new BusinessException("SlotBooking:InvalidStartDate");

        if (!LocalDatePattern.Iso.Parse(input.EndDate).Success)
            throw new BusinessException("SlotBooking:InvalidEndDate");

        var startDate = LocalDatePattern.Iso.Parse(input.StartDate).Value;
        var endDate   = LocalDatePattern.Iso.Parse(input.EndDate).Value;

        // Logical order check (before any date clamping)
        if (startDate > endDate)
            throw new BusinessException("SlotBooking:StartDateAfterEndDate");

        if (input.SlotDuration <= 0)
            throw new BusinessException("SlotBooking:InvalidSlotDuration");
    }

    private static void ValidateTimeZone(string timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
            throw new BusinessException("SlotBooking:InvalidTimeZone");

        if (DateTimeZoneProviders.Tzdb.GetZoneOrNull(timeZoneId) == null)
            throw new BusinessException("SlotBooking:InvalidTimeZone")
                .WithData("TimeZone", timeZoneId);
    }

    private static SlotDto MapToDto(Slot slot, DateTimeZone timeZone, Instant now, string timeZoneId)
    {
        var localStart      = SlotTimeFormatter.ToZonedDateTime(slot.StartInstant, timeZone);
        var localEnd        = SlotTimeFormatter.ToZonedDateTime(slot.EndInstant, timeZone);
        var durationMinutes = (int)(slot.EndInstant - slot.StartInstant).TotalMinutes;

        return new SlotDto
        {
            Id              = slot.Id,
            LocalStartTime  = SlotTimeFormatter.FormatLocalTime(localStart),
            LocalEndTime    = SlotTimeFormatter.FormatLocalTime(localEnd),
            TimeZone        = timeZoneId,
            DurationMinutes = durationMinutes,
            IsBookable      = slot.IsBookable(now),
            Status          = slot.Status.ToString()
        };
    }
}
