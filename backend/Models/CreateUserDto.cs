using System.ComponentModel.DataAnnotations;

namespace TaskManager.Models
{
    public class CreateUserDto
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(30, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 30 characters")]
        [RegularExpression("^[a-zA-Z0-9]+$", ErrorMessage = "Username must contain only letters and numbers with no spaces or special characters")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        [MaxLength(128, ErrorMessage = "Password cannot exceed 128 characters")]
        public string Password { get; set; } = string.Empty;

        public void Normalize()
        {
            Username = Username?.Trim().ToLower() ?? string.Empty;
            Email = Email?.Trim().ToLower() ?? string.Empty;
        }
    }
}