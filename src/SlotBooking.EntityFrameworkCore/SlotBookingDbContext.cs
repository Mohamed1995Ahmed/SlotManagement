using Microsoft.EntityFrameworkCore;
using SlotBooking.Slots;
using Volo.Abp.Data;
using Volo.Abp.EntityFrameworkCore;

namespace SlotBooking.EntityFrameworkCore;

[ConnectionStringName("Default")]
public class SlotBookingDbContext : AbpDbContext<SlotBookingDbContext>
{
    public DbSet<Slot> Slots { get; set; }

    public SlotBookingDbContext(DbContextOptions<SlotBookingDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(SlotBookingDbContext).Assembly);
    }
}
