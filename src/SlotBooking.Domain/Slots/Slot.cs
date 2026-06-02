using NodaTime;
using SlotBooking.Slots;
using Volo.Abp.Domain.Entities.Auditing;

namespace SlotBooking.Slots;

public class Slot : AuditedAggregateRoot<Guid>
{
    public Instant StartInstant { get; set; }
    public Instant EndInstant { get; set; }
    public string CreationTimeZone { get; set; } = default!;
    public SlotStatus Status { get; set; }

    protected Slot()
    {
    }

    public Slot(Guid id, Instant startInstant, Instant endInstant, string creationTimeZone)
        : base(id)
    {
        StartInstant = startInstant;
        EndInstant = endInstant;
        CreationTimeZone = creationTimeZone;
        Status = SlotStatus.Available;
    }

    public void Book()
    {
        Status = SlotStatus.Booked;
    }

    public bool IsBookable(Instant now)
    {
        return Status == SlotStatus.Available && StartInstant > now;
    }
}
