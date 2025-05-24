const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html lang="es">
            <head>
                <title>Perú Seguro | Gestión de Denuncias</title>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body>
                {children}
            </body>
        </html>
    )
}

export default Layout;