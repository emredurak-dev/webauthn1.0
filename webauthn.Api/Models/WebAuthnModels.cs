using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using Fido2NetLib;

namespace webauthn.Api.Models;

public class RegisterCredentialRequest
{
    [Required]
    public string Username { get; set; }
    public string? Origin { get; set; }
}

public class RegisterCredentialResponse
{
    public CredentialCreateOptions Options { get; set; }
}

public class MakeCredentialResponse
{
    public string Username { get; set; }
    [JsonPropertyName("rawId")]
    public string RawId { get; set; }
    public AuthenticatorAttestationRawResponse Response { get; set; }
}

public class AssertCredentialRequest
{
    public string Username { get; set; }
    public string? Origin { get; set; }
}

public class AssertCredentialResponse
{
    public AssertionOptions Options { get; set; }
}

public class VerifyAssertionResponse
{
    public string Username { get; set; }
    [JsonPropertyName("rawId")]
    public string RawId { get; set; }
    public AuthenticatorAssertionRawResponse Response { get; set; }
}

public class MakeCredentialCompleteRequest
{
    public string Username { get; set; }
    [JsonPropertyName("rawId")]
    public string RawId { get; set; }
    public AttestationRawResponse Response { get; set; }
    public string OriginalOptionsJson { get; set; }
}

public class AttestationRawResponse
{
    public string ClientDataJSON { get; set; }
    public string AttestationObject { get; set; }
}

public class VerifyAssertionCompleteRequest
{
    public string Username { get; set; }
    [JsonPropertyName("rawId")]
    public string RawId { get; set; }
    public AssertionRawResponse Response { get; set; }
    public string OriginalOptionsJson { get; set; }
}

public class AssertionRawResponse
{
    public string ClientDataJSON { get; set; }
    public string AuthenticatorData { get; set; }
    public string Signature { get; set; }
    public string? UserHandle { get; set; }
} 