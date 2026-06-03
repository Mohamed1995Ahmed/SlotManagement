using SlotBooking.Localization;
using Volo.Abp.Localization;
using Volo.Abp.Modularity;
using Volo.Abp.Validation;
using Volo.Abp.VirtualFileSystem;

namespace SlotBooking;

[DependsOn(
    typeof(AbpValidationModule),
    typeof(AbpLocalizationModule))]
public class SlotBookingDomainSharedModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpVirtualFileSystemOptions>(options =>
        {
            options.FileSets.AddEmbedded<SlotBookingDomainSharedModule>(
                baseNamespace: "SlotBooking");
        });

        Configure<AbpLocalizationOptions>(options =>
        {
            options.Resources
                .Add<SlotBookingResource>("en")
                .AddVirtualJson("/Localization");
        });
    }
}
