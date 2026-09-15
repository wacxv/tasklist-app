using System.ComponentModel.DataAnnotations;

namespace TaskManager.Models
{
    public class CreateTaskDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        public bool IsDone { get; set; }

        public DateTime? DueDate { get; set; }

        [Required(ErrorMessage = "UserId is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Valid UserId required")]
        public int UserId { get; set; }

        public void Normalize()
        {
            Title = Title?.Trim() ?? string.Empty;
        }
    }
}