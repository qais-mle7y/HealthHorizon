using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HealthTrackerApi.Data;
using HealthTrackerApi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HealthHorizon.Models;

namespace HealthTrackerApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly HealthTrackerContext _context;
        private readonly ILogger<UsersController> _logger;

        public UsersController(HealthTrackerContext context, ILogger<UsersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<User>> Register([FromBody] RegisterRequest registerRequest)
        {
            if (registerRequest == null)
            {
                return BadRequest("Invalid request payload.");
            }
            var user = new User
            {
                Name = registerRequest.Name,
                Username = registerRequest.Username,
                Email = registerRequest.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(registerRequest.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetUser", new { id = user.UserId }, user);
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest loginRequest)
        {
            _logger.LogInformation("Login attempt for user: {Username}", loginRequest.Username);

            var dbUser = await _context.Users.SingleOrDefaultAsync(u => u.Username == loginRequest.Username);
            if (dbUser == null || !BCrypt.Net.BCrypt.Verify(loginRequest.Password, dbUser.Password))
            {
                _logger.LogWarning("Unauthorized login attempt for user: {Username}", loginRequest.Username);
                return Unauthorized(new { Message = "Invalid credentials" });
            }

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, dbUser.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, dbUser.UserId.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your_secret_key_which_is_at_least_16_bytes"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "your_issuer",
                audience: "your_audience",
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds);

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Store user information in session
            HttpContext.Session.SetInt32("UserId", dbUser.UserId);
            HttpContext.Session.SetString("UserName", dbUser.Username);

            _logger.LogInformation("User {Username} logged in successfully", dbUser.Username);

            return Ok(new { Token = tokenString });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();

            // Also clear the session cookie
            Response.Cookies.Delete(".AspNetCore.Session");

            return Ok();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            // Check if the session exists
            var sessionUserId = HttpContext.Session.GetInt32("UserId");
            if (sessionUserId == null)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            return user;
        }

        [HttpGet("me")]
        [Authorize]
        public ActionResult GetUserDetails()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            var username = HttpContext.Session.GetString("UserName");

            if (userId == null || string.IsNullOrEmpty(username))
            {
                return Unauthorized("User not logged in.");
            }

            return Ok(new { 
                UserId = userId.Value,
                UserName = username,

            });
        }


        [HttpPut("update")]
        [Authorize]
        public async Task<ActionResult> UpdateUser([FromBody] UpdateUserRequest updateUserRequest)
        {
            var sessionUserId = HttpContext.Session.GetInt32("UserId");
            if (sessionUserId == null)
            {
                return Unauthorized("User not logged in.");
            }

            var user = await _context.Users.FindAsync(sessionUserId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Update user details
            user.Name = updateUserRequest.Name ?? user.Name;
            user.Email = updateUserRequest.Email ?? user.Email;

            if (!string.IsNullOrEmpty(updateUserRequest.Password))
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(updateUserRequest.Password);
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok("User details updated successfully.");
        }


    }
}
