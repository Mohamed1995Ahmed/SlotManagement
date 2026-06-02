using NodaTime;
using SlotBooking.Slots;
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
        string timeZoneId)
    {
        var slots = new List<Slot>();
        var duration = Duration.FromMinutes(slotDurationMinutes);

        for (var date = startDate; date <= endDate; date = date.PlusDays(1))
        {
            var dayStart = date.AtStartOfDayInZone(timeZone);
            var dayEnd = date.PlusDays(1).AtStartOfDayInZone(timeZone);
            var current = dayStart;

            while ((current + duration).ToInstant() <= dayEnd.ToInstant())
            {
                var slotEnd = current + duration;
                slots.Add(new Slot(
                    _guidGenerator.Create(),
                    current.ToInstant(),
                    slotEnd.ToInstant(),
                    timeZoneId));

                current = slotEnd;
            }
        }

        return slots;
    }
}
