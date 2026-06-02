using Volo.Abp.Modularity;
using Volo.Abp.Validation;

namespace SlotBooking;

[DependsOn(typeof(AbpValidationModule))]
public class SlotBookingDomainSharedModule : AbpModule
{
}
