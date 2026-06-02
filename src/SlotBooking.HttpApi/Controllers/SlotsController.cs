using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SlotBooking.Slots;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace SlotBooking.Controllers;

[RemoteService(Name = "Slots")]
[Area("app")]
[Route("api/app/slots")]
[AllowAnonymous]
public class SlotsController : AbpControllerBase
{
    private readonly ISlotsAppService _slotsAppService;

    public SlotsController(ISlotsAppService slotsAppService)
    {
        _slotsAppService = slotsAppService;
    }

    [HttpPost("generate")]
    public Task<GenerateSlotsResultDto> GenerateAsync([FromBody] GenerateSlotsInput input)
        => _slotsAppService.GenerateAsync(input);

    /// <summary>
    /// Returns a filtered, paginated page of slots.
    /// </summary>
    /// <param name="timeZone">IANA time zone ID (e.g. Africa/Cairo)</param>
    /// <param name="page">Zero-based page index (default 0)</param>
    /// <param name="pageSize">Items per page (default 10, max 100)</param>
    /// <param name="statusFilter">available | booked | (empty = all)</param>
    /// <param name="dateFrom">ISO date YYYY-MM-DD — filter start (inclusive)</param>
    /// <param name="dateTo">ISO date YYYY-MM-DD — filter end (inclusive)</param>
    [HttpGet("next")]
    public Task<PagedResultDto<SlotDto>> GetNextAvailableAsync(
        [FromQuery] string timeZone,
        [FromQuery] int    page         = 0,
        [FromQuery] int    pageSize     = 10,
        [FromQuery] string? statusFilter = null,
        [FromQuery] string? dateFrom    = null,
        [FromQuery] string? dateTo      = null)
        => _slotsAppService.GetNextAvailableAsync(new GetNextAvailableSlotsInput
        {
            TimeZone     = timeZone,
            Page         = page,
            PageSize     = pageSize,
            StatusFilter = statusFilter,
            DateFrom     = dateFrom,
            DateTo       = dateTo
        });

    [HttpPost("{id}/book")]
    public Task BookAsync(Guid id)
        => _slotsAppService.BookAsync(id);
}
