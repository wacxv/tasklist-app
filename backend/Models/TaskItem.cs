using System.Text.Json.Serialization;

namespace TaskManager.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Standard";
        public string Recurrence { get; set; } = "None";
        public DateTime? LastResetAt { get; set; }
        public bool IsDone { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DueDate { get; set; }

        public ICollection<TaskImage> Images { get; set; } = new List<TaskImage>();

        [JsonIgnore]
        public User? User { get; set; }
    }
}