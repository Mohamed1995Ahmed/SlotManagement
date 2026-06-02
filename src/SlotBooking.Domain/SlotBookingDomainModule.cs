using Volo.Abp.Domain;
using Volo.Abp.Modularity;

namespace SlotBooking;

[DependsOn(
    typeof(AbpDddDomainModule),
    typeof(SlotBookingDomainSharedModule))]
public class SlotBookingDomainModule : AbpModule
{
}
