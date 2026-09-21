using System.ComponentModel.DataAnnotations;

namespace TaskManager.Models
{
    public class CreateTaskDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        public string Priority { get; set; } = "Standard";

        public string Recurrence { get; set; } = "None";

        public DateTime? LastResetAt { get; set; }

        public bool IsDone { get; set; }

        public DateTime? DueDate { get; set; }

        [Required(ErrorMessage = "UserId is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Valid UserId required")]
        public int UserId { get; set; }

        public void Normalize()
        {
            Title = Title?.Trim() ?? string.Empty;
            Description = Description?.Trim() ?? string.Empty;
            Priority = string.IsNullOrWhiteSpace(Priority) ? "Standard" : Priority.Trim();
            Recurrence = string.IsNullOrWhiteSpace(Recurrence) ? "None" : Recurrence.Trim();
        }
    }
}