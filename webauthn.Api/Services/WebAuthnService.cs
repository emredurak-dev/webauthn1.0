using Fido2NetLib;
using Fido2NetLib.Objects;
using System.Text;

namespace webauthn.Api.Services;

public class WebAuthnService
{
    private readonly IFido2 _fido2;
    private readonly Dictionary<string, Fido2User> _users = new();
    private readonly Dictionary<string, List<StoredCredential>> _userCredentials = new();

    public WebAuthnService()
    {
        var domain = "localhost";
        var origins = new HashSet<string> 
        { 
            "https://localhost:7072",
            "https://webauthn.me",
            "https://webauthn.io"
        };

        _fido2 = new Fido2(new Fido2Configuration
        {
            ServerDomain = domain,
            ServerName = "WebAuthn Test Server",
            Origins = origins,
            TimestampDriftTolerance = 300000
        });
    }

    public class StoredCredential
    {
        public byte[] UserId { get; set; }
        public byte[] PublicKey { get; set; }
        public byte[] UserHandle { get; set; }
        public uint SignatureCounter { get; set; }
        public string CredType { get; set; }
        public DateTime RegDate { get; set; }
        public Guid AaGuid { get; set; }
        public byte[] CredentialId { get; set; }
    }

    public class Fido2User
    {
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public byte[] Id { get; set; }
    }

    public CredentialCreateOptions CreateCredentialOptionsAsync(string username, string displayName, string? origin = null)
    {
        // If origin is provided, create a new Fido2 instance with that origin
        var fido2ToUse = _fido2;
        if (!string.IsNullOrEmpty(origin))
        {
            var uri = new Uri(origin);
            var domain = uri.Host;
            var origins = new HashSet<string> 
            { 
                origin,
                "https://localhost:7072",
                "https://webauthn.me",
                "https://webauthn.io"
            };
            
            fido2ToUse = new Fido2(new Fido2Configuration
            {
                ServerDomain = domain,
                ServerName = "WebAuthn Test Server",
                Origins = origins,
                TimestampDriftTolerance = 300000
            });
        }

        var user = new Fido2NetLib.Fido2User
        {
            Name = username,
            DisplayName = displayName,
            Id = Encoding.UTF8.GetBytes(username) // Convert username to byte array
        };

        _users[username] = new Fido2User 
        { 
            Name = username, 
            DisplayName = displayName, 
            Id = user.Id 
        };

        var authenticatorSelection = new AuthenticatorSelection
        {
            RequireResidentKey = false,
            UserVerification = Fido2NetLib.Objects.UserVerificationRequirement.Preferred
        };

        var exts = new Fido2NetLib.Objects.AuthenticationExtensionsClientInputs() 
        { 
            Extensions = true,
            UserVerificationMethod = true 
        };

        var existingCredentials = new List<PublicKeyCredentialDescriptor>();
        if (_userCredentials.ContainsKey(username))
        {
            existingCredentials = _userCredentials[username]
                .Select(c => new PublicKeyCredentialDescriptor(c.CredentialId))
                .ToList();
        }

        var options = fido2ToUse.RequestNewCredential(
            user,
            existingCredentials,
            authenticatorSelection,
            Fido2NetLib.Objects.AttestationConveyancePreference.Direct,
            exts);

        return options;
    }

    public async Task<Fido2.CredentialMakeResult> MakeNewCredentialAsync(string username, AuthenticatorAttestationRawResponse attestationResponse, CredentialCreateOptions originalOptions, string? origin = null)
    {
        if (!_users.ContainsKey(username))
            throw new Exception("User not found");

        var user = _users[username];

        // Use the same Fido2 instance that was used to create the options
        var fido2ToUse = _fido2;
        if (!string.IsNullOrEmpty(origin))
        {
            var uri = new Uri(origin);
            var domain = uri.Host;
            var origins = new HashSet<string> 
            { 
                origin,
                "https://localhost:7072",
                "https://webauthn.me",
                "https://webauthn.io"
            };
            
            fido2ToUse = new Fido2(new Fido2Configuration
            {
                ServerDomain = domain,
                ServerName = "WebAuthn Test Server",
                Origins = origins,
                TimestampDriftTolerance = 300000
            });
        }

        var success = await fido2ToUse.MakeNewCredentialAsync(
            attestationResponse, 
            originalOptions,
            (args, cancellationToken) =>
            {
                if (_userCredentials.ContainsKey(username))
                {
                    var isUnique = !_userCredentials[username].Any(c => c.CredentialId.SequenceEqual(args.CredentialId));
                    return Task.FromResult(isUnique);
                }
                return Task.FromResult(true);
            });

        var storedCredential = new StoredCredential
        {
            UserId = user.Id,
            PublicKey = success.Result.PublicKey,
            UserHandle = success.Result.User.Id,
            SignatureCounter = success.Result.Counter,
            CredType = success.Result.CredType,
            RegDate = DateTime.Now,
            AaGuid = success.Result.Aaguid,
            CredentialId = success.Result.CredentialId
        };

        if (!_userCredentials.ContainsKey(username))
            _userCredentials[username] = new List<StoredCredential>();

        _userCredentials[username].Add(storedCredential);

        return success;
    }

    public AssertionOptions GetAssertionOptions(string username, string? origin = null)
    {
        if (!_userCredentials.ContainsKey(username))
            throw new Exception("User has no registered credentials");

        // If origin is provided, create a new Fido2 instance with that origin
        var fido2ToUse = _fido2;
        if (!string.IsNullOrEmpty(origin))
        {
            var uri = new Uri(origin);
            var domain = uri.Host;
            var origins = new HashSet<string> 
            { 
                origin,
                "https://localhost:7072",
                "https://webauthn.me",
                "https://webauthn.io"
            };
            
            fido2ToUse = new Fido2(new Fido2Configuration
            {
                ServerDomain = domain,
                ServerName = "WebAuthn Test Server",
                Origins = origins,
                TimestampDriftTolerance = 300000
            });
        }

        var credentials = _userCredentials[username]
            .Select(c => new PublicKeyCredentialDescriptor(c.CredentialId))
            .ToList();

        var exts = new Fido2NetLib.Objects.AuthenticationExtensionsClientInputs() 
        { 
            Extensions = true,
            UserVerificationMethod = true 
        };

        var options = fido2ToUse.GetAssertionOptions(
            credentials,
            Fido2NetLib.Objects.UserVerificationRequirement.Preferred,
            exts);

        return options;
    }

    public async Task<object> VerifyAssertionAsync(string username, AuthenticatorAssertionRawResponse assertionResponse, AssertionOptions originalOptions)
    {
        if (!_userCredentials.ContainsKey(username))
            throw new Exception("User has no registered credentials");

        var storedCredentials = _userCredentials[username];
        var credential = storedCredentials.FirstOrDefault(c => c.CredentialId.SequenceEqual(assertionResponse.Id));

        if (credential == null)
            throw new Exception("Unknown credential");

        var result = await _fido2.MakeAssertionAsync(
            assertionResponse,
            originalOptions,
            credential.PublicKey,
            credential.SignatureCounter,
            (args, cancellationToken) => Task.FromResult(true));

        // Update the counter
        credential.SignatureCounter = result.Counter;

        return result;
    }
} 