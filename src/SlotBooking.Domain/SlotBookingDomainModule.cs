using Microsoft.Extensions.DependencyInjection;
using SlotBooking.Slots;
using Volo.Abp.Domain;
using Volo.Abp.Modularity;

namespace SlotBooking;

[DependsOn(
    typeof(AbpDddDomainModule),
    typeof(SlotBookingDomainSharedModule))]
public class SlotBookingDomainModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        // Register the slot generator as transient so every Generate call
        // gets a clean, isolated instance. The interface lives in the Domain
        // layer; the concrete implementation is not self-registering.
        context.Services.AddTransient<ISlotGenerator, SlotGenerator>();
    }
}
