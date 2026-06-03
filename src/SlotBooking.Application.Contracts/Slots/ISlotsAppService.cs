using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace SlotBooking.Slots;

public interface ISlotsAppService : IApplicationService
{
    Task<GenerateSlotsResultDto> GenerateAsync(GenerateSlotsInput input);
    Task<PagedResultDto<SlotDto>> GetNextAvailableAsync(GetNextAvailableSlotsInput input);
    Task BookAsync(Guid id);
}

public class GenerateSlotsInput
{
    [Required]
    public string StartDate { get; set; } = default!;

    [Required]
    public string EndDate { get; set; } = default!;

    [Required]
    public string TimeZone { get; set; } = default!;

    [Range(1, int.MaxValue)]
    public int SlotDuration { get; set; }
}

public class GenerateSlotsResultDto
{
    public int TotalSlotsCreated { get; set; }

    /// <summary>
    /// Set when the requested start date was in the past and was automatically
    /// adjusted to today. Null when no adjustment was needed.
    /// </summary>
    public string? AdjustedStartDate { get; set; }
}

public class GetNextAvailableSlotsInput
{
    [Required]
    public string TimeZone { get; set; } = default!;

    /// <summary>Items per page (1–100, default 10).</summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 10;

    /// <summary>Zero-based page index.</summary>
    [Range(0, int.MaxValue)]
    public int Page { get; set; } = 0;

    // ── Filters ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Filter by status: "available", "booked", or null / empty = all.
    /// </summary>
    public string? StatusFilter { get; set; }

    /// <summary>
    /// ISO date string (YYYY-MM-DD). Only slots starting on or after this date
    /// (interpreted in the requested TimeZone) are returned.
    /// </summary>
    public string? DateFrom { get; set; }

    /// <summary>
    /// ISO date string (YYYY-MM-DD). Only slots starting on or before this date
    /// (interpreted in the requested TimeZone) are returned.
    /// </summary>
    public string? DateTo { get; set; }
}

public class SlotDto
{
    public Guid Id { get; set; }
    public string LocalStartTime { get; set; } = default!;
    public string LocalEndTime { get; set; } = default!;
    public string TimeZone { get; set; } = default!;
    public int DurationMinutes { get; set; }
    public bool IsBookable { get; set; }
    public string Status { get; set; } = default!;
}
