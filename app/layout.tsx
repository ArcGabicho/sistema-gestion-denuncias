import './globals.css'

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html lang="es">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="vortex-system-admin-page.pages.dev" />
                <meta property="og:title" content="Perú Seguro | Portal de Denuncias Online" />
                <meta property="og:description" content="Para reclamar el título profesional se nos ordenó desarrollar un portal de denuncias digital que permita a los ciudadanos reportar delitos de corrupción y extorsión." />
                <meta property="og:image" content="https://i.imgur.com/9cCG6Nc.png" />
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="vortex-system-admin-page.pages.dev" />
                <meta property="twitter:title" content="Perú Seguro | Portal de Denuncias Online" />
                <meta property="twitter:description" content="Para reclamar el título profesional se nos ordenó desarrollar un portal de denuncias digital que permita a los ciudadanos reportar delitos de corrupción y extorsión." />
                <meta property="twitter:image" content="https://i.imgur.com/9cCG6Nc.png" />
                <meta name="title" content="Perú Seguro | Portal de Denuncias Online" />
                <meta name="description" content="Para reclamar el título profesional se nos ordenó desarrollar un portal de denuncias digital que permita a los ciudadanos reportar delitos de corrupción y extorsión." />
                <title>Perú Seguro | Gestión de Denuncias</title>
            </head>
            <body>
                {children}
            </body>
        </html>
    )
}

export default Layout;