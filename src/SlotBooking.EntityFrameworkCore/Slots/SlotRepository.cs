using SlotBooking.Slots;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace SlotBooking.EntityFrameworkCore.Slots;

public class SlotRepository : EfCoreRepository<SlotBookingDbContext, Slot, Guid>, ISlotRepository
{
    public SlotRepository(IDbContextProvider<SlotBookingDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }
}
