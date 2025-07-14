# WebAuthn Passwordless Authentication Demo

This project demonstrates a complete WebAuthn (Web Authentication) implementation using **ASP.NET Core 6.0** for the backend and a **Chrome Extension** for frontend integration. It enables passwordless authentication via **Windows Hello** or **FIDO2 security keys**.

---

## ✨ Features

- ✅ Full WebAuthn support: registration & authentication
- 🧩 Chrome Extension for integration with [webauthn.me](https://webauthn.me)
- 🌐 Multi-origin support (e.g., `localhost`, `webauthn.me`)
- 🔐 Windows Hello & Security Key support
- 🔒 FIDO2 compliant & secure implementation

---

## 🧰 Tech Stack

### Backend

- **ASP.NET Core 6.0**
- **Fido2NetLib** – FIDO2/WebAuthn library
- **Swagger/OpenAPI** – for API documentation

### Frontend (Chrome Extension)

- **Vanilla JavaScript**
- **Manifest V3**
- **WebAuthn API**

---

## 📁 Project Structure

```
webauthn/
├── webauthn.Api/              
│   ├── Controllers/          
│   │   └── WebAuthnController.cs
│   ├── Models/               
│   │   └── WebAuthnModels.cs
│   ├── Services/             
│   │   └── WebAuthnService.cs
│   └── ChromeExtension/      
│       ├── manifest.json
│       ├── content.js
│       ├── background.js
│       ├── popup.html
│       └── popup.js
```

---

## ⚙️ Prerequisites

- [.NET 6.0 SDK](https://dotnet.microsoft.com/en-us/download)
- Google Chrome browser
- Configured **Windows Hello** or a **FIDO2 security key**

---

## 🚀 Setup and Installation

### Backend

```bash
git clone https://github.com/yourusername/webauthn.git
cd webauthn/webauthn.Api
dotnet restore
dotnet build
dotnet run
```

### Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `ChromeExtension/` folder from the repo

---

## ⚙️ Configuration

You can configure allowed origins for WebAuthn in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFido2(options =>
{
    options.ServerDomain = "localhost";
    options.ServerName = "WebAuthn Demo";
    options.Origins = new HashSet<string> 
    { 
        "https://webauthn.me", 
        "https://localhost:7072" 
    };
});
```

---

## 📡 API Endpoints

| Method | Endpoint                      | Description                      |
|--------|-------------------------------|----------------------------------|
| POST   | `/webauthn/register-credential` | Start credential registration     |
| POST   | `/webauthn/make-credential`     | Complete credential registration  |
| POST   | `/webauthn/assert-credential`   | Start user authentication         |
| POST   | `/webauthn/verify-assertion`    | Complete user authentication      |

---

## 🔐 Security Considerations

- Follows **FIDO2** and **WebAuthn** security best practices
- Strict **origin validation**
- **Content isolation** in the Chrome Extension
- Proper state handling for challenge/response flows
- Credentials securely stored and verified

---

## ⚠️ Known Limitations

- Only tested on **Chrome**
- Requires **Windows Hello** or **FIDO2 security key**
- Optimized for **localhost** during development

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create your feature branch  
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes  
   ```bash
   git commit -m "Add some amazing feature"
   ```
4. Push to the branch  
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Fido2NetLib](https://github.com/passwordless-lib/fido2-net-lib)
- [WebAuthn.me](https://webauthn.me)
- Chrome Extension API documentation & community

---

## 📬 Contact

**Your Name** – [@yourusername](https://github.com/yourusername)  
**Project Link** – [https://github.com/yourusername/webauthn](https://github.com/yourusername/webauthn)
