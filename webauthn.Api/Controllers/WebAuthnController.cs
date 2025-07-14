using Microsoft.AspNetCore.Mvc;
using webauthn.Api.Models;
using webauthn.Api.Services;
using Fido2NetLib;

namespace webauthn.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebAuthnController : ControllerBase
{
    private readonly WebAuthnService _webAuthnService;

    public WebAuthnController(WebAuthnService webAuthnService)
    {
        _webAuthnService = webAuthnService;
    }

    [HttpPost("register")]
    public ActionResult<RegisterCredentialResponse> Register([FromBody] RegisterCredentialRequest request)
    {
        try
        {
            // Use Username as DisplayName as well
            var options = _webAuthnService.CreateCredentialOptionsAsync(request.Username, request.Username, request.Origin);

            return new RegisterCredentialResponse { Options = options };
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("register/complete")]
    public async Task<ActionResult> RegisterComplete([FromBody] MakeCredentialCompleteRequest request)
    {
        try
        {
            var options = CredentialCreateOptions.FromJson(request.OriginalOptionsJson);

            Console.WriteLine($"Incoming request: {System.Text.Json.JsonSerializer.Serialize(request)}");
            
            // Create a proper JSON structure that Fido2NetLib expects
            var attestationJson = new
            {
                type = "public-key",
                id = request.RawId,
                rawId = request.RawId,
                response = new
                {
                    clientDataJSON = request.Response.ClientDataJSON,
                    attestationObject = request.Response.AttestationObject
                }
            };
            
            var attestationJsonString = System.Text.Json.JsonSerializer.Serialize(attestationJson);
            Console.WriteLine($"Attestation JSON: {attestationJsonString}");
            
            var rawResponse = System.Text.Json.JsonSerializer.Deserialize<AuthenticatorAttestationRawResponse>(attestationJsonString);

            // Get origin
            var optionsDoc = System.Text.Json.JsonDocument.Parse(request.OriginalOptionsJson);
            var rpId = optionsDoc.RootElement.GetProperty("rp").GetProperty("id").GetString();
            var originForVerification = $"https://{rpId}";
            
            Console.WriteLine($"Using origin for verification: {originForVerification}");
            
            var result = await _webAuthnService.MakeNewCredentialAsync(request.Username, rawResponse, options, originForVerification);
            return Ok(new { status = "ok" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Registration error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("authenticate")]
    public ActionResult<AssertCredentialResponse> Authenticate([FromBody] AssertCredentialRequest request)
    {
        try
        {
            var options = _webAuthnService.GetAssertionOptions(request.Username, request.Origin);

            return new AssertCredentialResponse { Options = options };
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("authenticate/complete")]
    public async Task<ActionResult> AuthenticateComplete([FromBody] VerifyAssertionCompleteRequest request)
    {
        try
        {
            var options = AssertionOptions.FromJson(request.OriginalOptionsJson);

            // Create a proper JSON structure that Fido2NetLib expects
            var assertionJson = new
            {
                type = "public-key",
                id = request.RawId,
                rawId = request.RawId,
                response = new
                {
                    clientDataJSON = request.Response.ClientDataJSON,
                    authenticatorData = request.Response.AuthenticatorData,
                    signature = request.Response.Signature,
                    userHandle = request.Response.UserHandle
                }
            };
            
            var assertionJsonString = System.Text.Json.JsonSerializer.Serialize(assertionJson);
            var rawResponse = System.Text.Json.JsonSerializer.Deserialize<AuthenticatorAssertionRawResponse>(assertionJsonString);

            var result = await _webAuthnService.VerifyAssertionAsync(request.Username, rawResponse, options);
            return Ok(new { status = "ok" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
} 