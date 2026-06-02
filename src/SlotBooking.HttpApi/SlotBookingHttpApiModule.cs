using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using SlotBooking.Controllers;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Modularity;

namespace SlotBooking;

[DependsOn(
    typeof(SlotBookingApplicationContractsModule),
    typeof(AbpAspNetCoreMvcModule))]
public class SlotBookingHttpApiModule : AbpModule
{
    public override void PreConfigureServices(ServiceConfigurationContext context)
    {
        PreConfigure<IMvcBuilder>(mvcBuilder =>
        {
            mvcBuilder.AddApplicationPartIfNotExists(typeof(SlotsController).Assembly);
        });
    }
}
