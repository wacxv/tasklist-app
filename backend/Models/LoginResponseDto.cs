namespace TaskManager.Models
{
    public class LoginResponseDto
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }
}