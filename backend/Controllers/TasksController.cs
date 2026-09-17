using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

using TaskManager.Models;
using TaskManager.Data;

namespace TaskManager.API
{
    [Route("tasks")]
    [ApiController]
    [Authorize]  // Require auth for all endpoints
    public class TasksController : ControllerBase
    {
        private const long MaxImageSize = 5 * 1024 * 1024;
        private readonly ApplicationDbContext _context;

        public TasksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            
            // Only show tasks for the authenticated user
            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId)
                .ToListAsync();
            
            return Ok(tasks);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();
            
            // Only owner can view their task
            if (task.UserId != userId)
                return Forbid("You can only view your own tasks");
            
            return Ok(task);
        }

        [HttpPost("{id:int}/images")]
        [RequestSizeLimit(MaxImageSize)]
        public async Task<IActionResult> UploadImage(int id, IFormFile image)
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (task == null) return NotFound();
            if (image == null || image.Length == 0) return BadRequest("An image is required");
            if (image.Length > MaxImageSize) return BadRequest("Images must be 5 MB or smaller");
            if (!image.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only image files are allowed");

            await using var stream = new MemoryStream();
            await image.CopyToAsync(stream);

            var taskImage = new TaskImage
            {
                TaskItemId = task.Id,
                FileName = Path.GetFileName(image.FileName),
                ContentType = image.ContentType,
                Data = stream.ToArray()
            };

            _context.TaskImages.Add(taskImage);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetImage), new { id = task.Id, imageId = taskImage.Id }, new
            {
                taskImage.Id,
                taskImage.FileName,
                taskImage.ContentType,
                taskImage.UploadedAt
            });
        }

        [HttpGet("{id:int}/images/{imageId:int}")]
        public async Task<IActionResult> GetImage(int id, int imageId)
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var image = await _context.TaskImages
                .Include(taskImage => taskImage.TaskItem)
                .FirstOrDefaultAsync(taskImage => taskImage.Id == imageId
                    && taskImage.TaskItemId == id
                    && taskImage.TaskItem!.UserId == userId);

            if (image == null) return NotFound();

            return File(image.Data, image.ContentType, image.FileName);
        }

        [HttpDelete("{id:int}/images/{imageId:int}")]
        public async Task<IActionResult> DeleteImage(int id, int imageId)
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var image = await _context.TaskImages
                .Include(taskImage => taskImage.TaskItem)
                .FirstOrDefaultAsync(taskImage => taskImage.Id == imageId
                    && taskImage.TaskItemId == id
                    && taskImage.TaskItem!.UserId == userId);

            if (image == null) return NotFound();

            _context.TaskImages.Remove(image);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            dto.Normalize();
            
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Title cannot be empty");
            
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            
            // Tasks can only be created for the authenticated user
            if (dto.UserId != userId)
                return Forbid("You can only create tasks for yourself");
            
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
            if (!userExists) return BadRequest("User does not exist");
            
            var task = new TaskItem
            {
                Title = dto.Title,
                IsDone = dto.IsDone,
                UserId = dto.UserId,
                DueDate = dto.DueDate
            };
            
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Normalize input
            dto.Normalize();
            
            // Validate empty title
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Title cannot be empty");

            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            // Only owner can update their task
            if (task.UserId != userId)
                return Forbid("You can only update your own tasks");

            task.Title = dto.Title;
            task.IsDone = dto.IsDone;
            task.DueDate = dto.DueDate;
            await _context.SaveChangesAsync();
            
            return Ok(task);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            // Only owner can delete their task
            if (task.UserId != userId)
                return Forbid("You can only delete your own tasks");

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            
            return NoContent();
        }
    }
}
