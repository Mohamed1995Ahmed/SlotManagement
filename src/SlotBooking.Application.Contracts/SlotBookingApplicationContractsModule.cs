using Volo.Abp.Application;
using Volo.Abp.Modularity;

namespace SlotBooking;

[DependsOn(
    typeof(AbpDddApplicationContractsModule),
    typeof(SlotBookingDomainSharedModule))]
public class SlotBookingApplicationContractsModule : AbpModule
{
}
