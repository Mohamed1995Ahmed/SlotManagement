using NodaTime;
using SlotBooking.Slots;

namespace SlotBooking.Slots;

public interface ISlotGenerator
{
    IReadOnlyList<Slot> Generate(
        LocalDate startDate,
        LocalDate endDate,
        DateTimeZone timeZone,
        int slotDurationMinutes,
        string timeZoneId);
}
