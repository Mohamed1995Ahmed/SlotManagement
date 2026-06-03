using NodaTime;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Guids;

namespace SlotBooking.Slots;

public class SlotGenerator : ISlotGenerator, ITransientDependency
{
    private readonly IGuidGenerator _guidGenerator;

    public SlotGenerator(IGuidGenerator guidGenerator)
    {
        _guidGenerator = guidGenerator;
    }

    public IReadOnlyList<Slot> Generate(
        LocalDate startDate,
        LocalDate endDate,
        DateTimeZone timeZone,
        int slotDurationMinutes,
        string timeZoneId,
        Instant? notBefore = null)
    {
        var slots    = new List<Slot>();
        var duration = Duration.FromMinutes(slotDurationMinutes);

        for (var date = startDate; date <= endDate; date = date.PlusDays(1))
        {
            var dayStart = date.AtStartOfDayInZone(timeZone);
            var dayEnd   = date.PlusDays(1).AtStartOfDayInZone(timeZone);
            var current  = dayStart;

            while ((current + duration).ToInstant() <= dayEnd.ToInstant())
            {
                var slotEnd = current + duration;

                // Skip any slot that ends at or before the cutoff instant.
                // This trims past slots precisely to the current time, not just to
                // the start of the day.
                if (!notBefore.HasValue || slotEnd.ToInstant() > notBefore.Value)
                {
                    slots.Add(new Slot(
                        _guidGenerator.Create(),
                        current.ToInstant(),
                        slotEnd.ToInstant(),
                        timeZoneId));
                }

                current = slotEnd;
            }
        }

        return slots;
    }
}
