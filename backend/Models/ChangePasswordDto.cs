using System.ComponentModel.DataAnnotations;

namespace TaskManager.Models
{
    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "Current password is required")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        [MaxLength(128, ErrorMessage = "Password cannot exceed 128 characters")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
