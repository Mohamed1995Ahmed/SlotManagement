using NodaTime;
using Shouldly;
using SlotBooking.Slots;
using Xunit;

namespace SlotBooking.Slots;

public class SlotTimeFormatterTests
{
    [Fact]
    public void Should_convert_instant_to_different_local_times_by_zone()
    {
        var instant = Instant.FromUtc(2026, 6, 2, 13, 30);
        var cairo = DateTimeZoneProviders.Tzdb["Africa/Cairo"];
        var london = DateTimeZoneProviders.Tzdb["Europe/London"];
        var newYork = DateTimeZoneProviders.Tzdb["America/New_York"];

        var cairoLocal = SlotTimeFormatter.ToZonedDateTime(instant, cairo);
        var londonLocal = SlotTimeFormatter.ToZonedDateTime(instant, london);
        var newYorkLocal = SlotTimeFormatter.ToZonedDateTime(instant, newYork);

        SlotTimeFormatter.FormatLocalTime(cairoLocal).ShouldContain("+03");
        SlotTimeFormatter.FormatLocalTime(londonLocal).ShouldContain("+01");
        SlotTimeFormatter.FormatLocalTime(newYorkLocal).ShouldContain("-04");

        cairoLocal.Hour.ShouldBe(16);
        londonLocal.Hour.ShouldBe(14);
        newYorkLocal.Hour.ShouldBe(9);
    }
}
