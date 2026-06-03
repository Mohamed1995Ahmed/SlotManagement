using NodaTime;

namespace SlotBooking.Slots;

public interface ISlotGenerator
{
    /// <summary>
    /// Generates slots for every day in [startDate, endDate] using the given
    /// time zone and slot duration.
    /// </summary>
    /// <param name="notBefore">
    /// When provided, any slot whose <em>end</em> instant is at or before this
    /// value is skipped. Pass <c>SystemClock.Instance.GetCurrentInstant()</c>
    /// to exclude slots that are already in the past at generation time.
    /// </param>
    IReadOnlyList<Slot> Generate(
        LocalDate startDate,
        LocalDate endDate,
        DateTimeZone timeZone,
        int slotDurationMinutes,
        string timeZoneId,
        Instant? notBefore = null);
}
