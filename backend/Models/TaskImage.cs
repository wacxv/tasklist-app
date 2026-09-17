using System.Text.Json.Serialization;

namespace TaskManager.Models
{
    public class TaskImage
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public byte[] Data { get; set; } = Array.Empty<byte>();
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public TaskItem? TaskItem { get; set; }
    }
}
