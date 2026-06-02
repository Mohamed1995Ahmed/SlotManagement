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
    {
        return _slotsAppService.GenerateAsync(input);
    }

    /// <summary>
    /// Returns a page of the next available slots.
    /// </summary>
    /// <param name="timeZone">IANA time zone ID, e.g. Africa/Cairo</param>
    /// <param name="pageSize">Items per page (default 20, max 100)</param>
    /// <param name="page">Zero-based page index (default 0)</param>
    [HttpGet("next")]
    public Task<PagedResultDto<SlotDto>> GetNextAvailableAsync(
        [FromQuery] string timeZone,
        [FromQuery] int pageSize = 20,
        [FromQuery] int page = 0)
    {
        return _slotsAppService.GetNextAvailableAsync(new GetNextAvailableSlotsInput
        {
            TimeZone = timeZone,
            PageSize = pageSize,
            Page     = page
        });
    }

    [HttpPost("{id}/book")]
    public Task BookAsync(Guid id)
    {
        return _slotsAppService.BookAsync(id);
    }
}
