using System.Globalization;
using NodaTime;
using NodaTime.Text;
using SlotBooking.Slots;

namespace SlotBooking.Slots;

public static class SlotTimeFormatter
{
    public static string FormatLocalTime(ZonedDateTime localTime)
    {
        return OffsetDateTimePattern.ExtendedIso.Format(localTime.ToOffsetDateTime());
    }

    public static ZonedDateTime ToZonedDateTime(Instant instant, DateTimeZone timeZone)
    {
        return instant.InZone(timeZone);
    }
}
