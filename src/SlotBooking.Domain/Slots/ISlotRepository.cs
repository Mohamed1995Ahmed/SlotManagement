using SlotBooking.Slots;
using Volo.Abp.Domain.Repositories;

namespace SlotBooking.Slots;

public interface ISlotRepository : IRepository<Slot, Guid>
{
}
