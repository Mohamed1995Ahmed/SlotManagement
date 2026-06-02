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

    public async Task<GenerateSlotsResultDto> GenerateAsync(GenerateSlotsInput input)
    {
        ValidateGenerateInput(input);

        var startDate = LocalDatePattern.Iso.Parse(input.StartDate).Value;
        var endDate = LocalDatePattern.Iso.Parse(input.EndDate).Value;
        var timeZone = DateTimeZoneProviders.Tzdb[input.TimeZone];

        var slots = _slotGenerator.Generate(
            startDate,
            endDate,
            timeZone,
            input.SlotDuration,
            input.TimeZone);

        await _slotRepository.InsertManyAsync(slots, autoSave: true);

        return new GenerateSlotsResultDto
        {
            TotalSlotsCreated = slots.Count
        };
    }

    public async Task<PagedResultDto<SlotDto>> GetNextAvailableAsync(GetNextAvailableSlotsInput input)
    {
        ValidateTimeZone(input.TimeZone);

        var timeZone = DateTimeZoneProviders.Tzdb[input.TimeZone];
        var now = SystemClock.Instance.GetCurrentInstant();

        var queryable = await _slotRepository.GetQueryableAsync();

        var filtered = queryable
            .Where(x => x.Status == SlotStatus.Available && x.StartInstant > now)
            .OrderBy(x => x.StartInstant);

        var totalCount = filtered.Count();

        var items = filtered
            .Skip(input.Page * input.PageSize)
            .Take(input.PageSize)
            .ToList();

        var dtos = items
            .Select(slot => MapToDto(slot, timeZone, now, input.TimeZone))
            .ToList();

        return new PagedResultDto<SlotDto>(totalCount, dtos);
    }

    public async Task BookAsync(Guid id)
    {
        var slot = await _slotRepository.GetAsync(id);
        if (slot.Status == SlotStatus.Booked)
        {
            throw new BusinessException("SlotBooking:SlotAlreadyBooked")
                .WithData("SlotId", id);
        }

        slot.Book();
        await _slotRepository.UpdateAsync(slot, autoSave: true);
    }

    // ── Validation ────────────────────────────────────────────────────────────

    private static void ValidateGenerateInput(GenerateSlotsInput input)
    {
        ValidateTimeZone(input.TimeZone);

        if (!LocalDatePattern.Iso.Parse(input.StartDate).Success)
            throw new BusinessException("SlotBooking:InvalidStartDate");

        if (!LocalDatePattern.Iso.Parse(input.EndDate).Success)
            throw new BusinessException("SlotBooking:InvalidEndDate");

        var startDate = LocalDatePattern.Iso.Parse(input.StartDate).Value;
        var endDate   = LocalDatePattern.Iso.Parse(input.EndDate).Value;

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

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static SlotDto MapToDto(Slot slot, DateTimeZone timeZone, Instant now, string timeZoneId)
    {
        var localStart      = SlotTimeFormatter.ToZonedDateTime(slot.StartInstant, timeZone);
        var localEnd        = SlotTimeFormatter.ToZonedDateTime(slot.EndInstant, timeZone);
        var durationMinutes = (int)(slot.EndInstant - slot.StartInstant).TotalMinutes;

        return new SlotDto
        {
            Id             = slot.Id,
            LocalStartTime = SlotTimeFormatter.FormatLocalTime(localStart),
            LocalEndTime   = SlotTimeFormatter.FormatLocalTime(localEnd),
            TimeZone       = timeZoneId,
            DurationMinutes = durationMinutes,
            IsBookable     = slot.IsBookable(now)
        };
    }
}
