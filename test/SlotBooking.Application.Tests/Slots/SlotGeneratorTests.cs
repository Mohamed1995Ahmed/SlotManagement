using NodaTime;
using Shouldly;
using SlotBooking.Slots;
using Volo.Abp.Guids;
using Xunit;

namespace SlotBooking.Slots;

public class SlotGeneratorTests
{
    private readonly SlotGenerator _generator = new(new TestGuidGenerator());

    [Fact]
    public void Should_generate_slots_for_single_day()
    {
        var zone = DateTimeZoneProviders.Tzdb["Africa/Cairo"];
        var start = new LocalDate(2026, 6, 1);
        var end = new LocalDate(2026, 6, 1);

        var slots = _generator.Generate(start, end, zone, 60, "Africa/Cairo");

        slots.Count.ShouldBe(24);
        slots[0].StartInstant.ShouldBe(new LocalDateTime(2026, 6, 1, 0, 0).InZoneLeniently(zone).ToInstant());
        slots[^1].EndInstant.ShouldBe(new LocalDateTime(2026, 6, 2, 0, 0).InZoneLeniently(zone).ToInstant());
    }

    [Fact]
    public void Should_generate_slots_across_multiple_days()
    {
        var zone = DateTimeZoneProviders.Tzdb["America/New_York"];
        var start = new LocalDate(2026, 6, 1);
        var end = new LocalDate(2026, 6, 2);

        var slots = _generator.Generate(start, end, zone, 30, "America/New_York");

        slots.Count.ShouldBe(96);
        slots.ShouldAllBe(slot => slot.CreationTimeZone == "America/New_York");
    }

    [Fact]
    public void Should_store_instants_in_utc_independent_form()
    {
        var cairo = DateTimeZoneProviders.Tzdb["Africa/Cairo"];
        var newYork = DateTimeZoneProviders.Tzdb["America/New_York"];
        var date = new LocalDate(2026, 6, 1);

        var cairoSlots = _generator.Generate(date, date, cairo, 60, "Africa/Cairo");
        var nySlots = _generator.Generate(date, date, newYork, 60, "America/New_York");

        cairoSlots[12].StartInstant.ShouldNotBe(nySlots[12].StartInstant);

        var cairoLocal = cairoSlots[12].StartInstant.InZone(cairo);
        var nyLocal = nySlots[12].StartInstant.InZone(newYork);

        cairoLocal.Hour.ShouldBe(12);
        nyLocal.Hour.ShouldBe(12);
    }

    private sealed class TestGuidGenerator : IGuidGenerator
    {
        public Guid Create() => Guid.NewGuid();
    }
}
