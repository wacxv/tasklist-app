using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TaskManager.Models;
using TaskManager.Data;
using TaskManager.Services;
using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;

namespace TaskManager.API
{
    [Route("users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPasswordValidator _passwordValidator;

        public UsersController(ApplicationDbContext context, IJwtService jwtService, IPasswordValidator passwordValidator)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordValidator = passwordValidator;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Normalize email
            var email = dto.Email?.Trim().ToLower() ?? string.Empty;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return Unauthorized(new { message = "Invalid email or password" });

            if (!VerifyPassword(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid email or password" });

            var token = _jwtService.GenerateToken(user);
            return Ok(new LoginResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                Token = token
            });
        }

        [Authorize(Roles = "Admin")]  // Only Admin can see all users
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.Tasks)
                .AsNoTracking()
                .ToListAsync();
            return Ok(users);
        }

        [Authorize]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var userId = User.FindFirst("userId")?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Allow admin or owner to view
            if (userId != id.ToString() && userRole != "Admin")
                return Forbid("You can only view your own profile");

            var user = await _context.Users
                .Include(u => u.Tasks)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);
                
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            dto.Normalize();

            var (isValid, error) = _passwordValidator.ValidatePassword(dto.Password);
            if (!isValid) return BadRequest(new { message = error });

            var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists) 
                return Conflict(new { message = "Email is already registered. Please login instead." });

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = HashPassword(dto.Password),
                Role = "User"  // Default role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            var token = _jwtService.GenerateToken(user);
            return CreatedAtAction(nameof(Get), new { id = user.Id }, new LoginResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                Token = token
            });
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = User.FindFirst("userId")?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Allow admin or owner to delete
            if (userId != id.ToString() && userRole != "Admin")
                return Forbid("You can only delete your own account");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string hash)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput == hash;
        }
    }
}