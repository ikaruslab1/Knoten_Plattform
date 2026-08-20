import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Row,
  Column,
  Hr,
  Link,
} from 'react-email'

interface Props {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  numeroCuenta: string
  correoInstitucional: string
  correoPersonal: string
  telefono: string
  password?: string
}

export function WelcomeEmail({
  nombre,
  apellidoPaterno,
  apellidoMaterno,
  numeroCuenta,
  correoInstitucional,
  correoPersonal,
  telefono,
  password = '',
}: Props) {
  const loginUrl = `https://knoten.scherry.click/login?email=${encodeURIComponent(
    correoPersonal
  )}&password=${encodeURIComponent(password)}`

  return (
    <Html lang="es">
      <Head>
        <style>{`
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
          }
          .email-link {
            color: #09090b !important;
            text-decoration: none !important;
          }
        `}</style>
      </Head>
      <Body
        style={{
          backgroundColor: '#f4f4f5',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          margin: '0',
          padding: '40px 0',
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '0px',
            overflow: 'hidden',
            border: '1px solid #e4e4e7',
          }}
        >
          {/* Header Block - Black with white text */}
          <Section
            style={{
              backgroundColor: '#000000',
              padding: '36px 32px',
              textAlign: 'center',
            }}
          >
            <Heading
              style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#ffffff',
                margin: '0',
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              KNOTEN
            </Heading>
          </Section>

          {/* Main Body */}
          <Section style={{ padding: '32px 32px 20px 32px' }}>
            <Heading
              as="h2"
              style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#09090b',
                margin: '0 0 12px 0',
                letterSpacing: '-0.3px',
              }}
            >
              Bienvenido a Knoten
            </Heading>
            <Text
              style={{
                color: '#52525b',
                margin: '0',
                lineHeight: '1.6',
                fontSize: '15px',
              }}
            >
              Hola, <strong style={{ color: '#09090b' }}>{nombre} {apellidoPaterno}</strong>. Tu cuenta ha sido registrada exitosamente en la plataforma.
            </Text>
          </Section>

          {/* Sección: Datos para iniciar sesión (Fondo Gris, Texto Negro) */}
          <Section style={{ padding: '0 32px 20px 32px' }}>
            <div
              style={{
                backgroundColor: '#f4f4f5',
                borderRadius: '6px',
                padding: '24px',
                border: '1px solid #e4e4e7',
              }}
            >
              <Text
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#71717a',
                  margin: '0 0 16px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Datos para iniciar sesión
              </Text>

              <Row style={{ marginBottom: '12px' }}>
                <Column style={{ width: '40%', paddingRight: '8px' }}>
                  <Text style={{ margin: '0', fontSize: '13px', color: '#71717a', fontWeight: '500' }}>
                    Correo electrónico:
                  </Text>
                </Column>
                <Column>
                  <Text
                    style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#09090b',
                      fontWeight: '600',
                    }}
                  >
                    <a
                      href={`mailto:${correoPersonal}`}
                      style={{ color: '#09090b', textDecoration: 'none' }}
                      className="email-link"
                    >
                      {correoPersonal}
                    </a>
                  </Text>
                </Column>
              </Row>

              <Row style={{ marginBottom: '20px' }}>
                <Column style={{ width: '40%', paddingRight: '8px' }}>
                  <Text style={{ margin: '0', fontSize: '13px', color: '#71717a', fontWeight: '500' }}>
                    Contraseña:
                  </Text>
                </Column>
                <Column>
                  <Text
                    style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#09090b',
                      fontWeight: '600',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {password || '••••••••'}
                  </Text>
                </Column>
              </Row>

              <div style={{ marginTop: '16px' }}>
                <Link
                  href={loginUrl}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          </Section>

          {/* Recordatorio de Confirmación de Correo */}
          <Section style={{ padding: '0 32px 24px 32px' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderLeft: '4px solid #09090b',
                padding: '16px 20px',
                borderTop: '1px solid #e4e4e7',
                borderRight: '1px solid #e4e4e7',
                borderBottom: '1px solid #e4e4e7',
                borderRadius: '0 6px 6px 0',
              }}
            >
              <Text
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#09090b',
                  margin: '0 0 6px 0',
                }}
              >
                ⚠️ Confirmación requerida para ingresar
              </Text>
              <Text
                style={{
                  fontSize: '13px',
                  color: '#52525b',
                  margin: '0',
                  lineHeight: '1.5',
                }}
              >
                Antes de poder iniciar sesión, debes verificar tu cuenta. Hemos enviado un correo a tu dirección personal con el asunto{' '}
                <strong style={{ color: '#09090b' }}>"Confirma tu correo electrónico"</strong>. Por favor, abre dicho mensaje y haz clic en el enlace de confirmación para habilitar tu acceso.
              </Text>
            </div>
          </Section>

          {/* Sección: Resumen de datos */}
          <Section style={{ padding: '0 32px 32px 32px' }}>
            <Text
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#71717a',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Resumen de información del registro
            </Text>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#f4f4f5',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid #e4e4e7',
              }}
            >
              <tbody>
                {[
                  ['Nombre completo', `${nombre} ${apellidoPaterno} ${apellidoMaterno}`],
                  ['Número de cuenta UNAM', numeroCuenta],
                  ['Correo institucional', correoInstitucional],
                  ['Correo personal', correoPersonal],
                  ['Teléfono', telefono],
                ].map(([label, val], idx, arr) => (
                  <tr
                    key={label}
                    style={{
                      borderBottom: idx < arr.length - 1 ? '1px solid #e4e4e7' : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: '#71717a',
                        width: '45%',
                        backgroundColor: '#fafafa',
                        fontWeight: '500',
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: '#09090b',
                        fontWeight: '600',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      {val.includes('@') ? (
                        <a
                          href={`mailto:${val}`}
                          style={{ color: '#09090b', textDecoration: 'none' }}
                          className="email-link"
                        >
                          {val}
                        </a>
                      ) : (
                        val
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: '#e4e4e7', margin: '0 32px 24px 32px' }} />

          {/* Footer */}
          <Section style={{ padding: '0 32px 32px 32px', textAlign: 'center' }}>
            <Text
              style={{
                fontSize: '11px',
                color: '#a1a1aa',
                margin: '0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              © KNOTEN. TODOS LOS DERECHOS RESERVADOS.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
