using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NodaTime;
using SlotBooking.Slots;
using Volo.Abp.EntityFrameworkCore.Modeling;

namespace SlotBooking.EntityFrameworkCore.Slots;

public class SlotEntityTypeConfiguration : IEntityTypeConfiguration<Slot>
{
    public void Configure(EntityTypeBuilder<Slot> builder)
    {
        builder.ToTable(SlotBookingConsts.DbTablePrefix + "Slots", SlotBookingConsts.DbSchema);
        builder.ConfigureByConvention();

        builder.Property(x => x.CreationTimeZone)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(x => x.StartInstant)
            .HasConversion(
                instant => instant.ToDateTimeUtc(),
                dateTime => Instant.FromDateTimeUtc(DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)));

        builder.Property(x => x.EndInstant)
            .HasConversion(
                instant => instant.ToDateTimeUtc(),
                dateTime => Instant.FromDateTimeUtc(DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)));

        builder.HasIndex(x => x.StartInstant);
        builder.HasIndex(x => x.Status);
    }
}
