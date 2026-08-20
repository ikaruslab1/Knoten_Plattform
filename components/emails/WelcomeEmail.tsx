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
  password,
}: Props) {
  const loginUrl = 'https://knoten.scherry.click/login'

  return (
    <Html lang="es">
      <Head />
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
          {/* Header Block - Black with white text like confirmation email */}
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
          <Section style={{ padding: '32px 32px 16px 32px' }}>
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
                margin: '0 0 24px 0',
                lineHeight: '1.6',
                fontSize: '15px',
              }}
            >
              Hola, <strong style={{ color: '#09090b' }}>{nombre} {apellidoPaterno}</strong>. Tu cuenta ha sido registrada exitosamente en la plataforma.
            </Text>
          </Section>

          {/* Seccion: Datos para iniciar sesion (Highlighted Block) */}
          <Section style={{ padding: '0 32px 24px 32px' }}>
            <div
              style={{
                backgroundColor: '#09090b',
                borderRadius: '6px',
                padding: '24px',
                color: '#ffffff',
              }}
            >
              <Text
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#a1a1aa',
                  margin: '0 0 16px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Datos para iniciar sesión
              </Text>

              <Row style={{ marginBottom: '12px' }}>
                <Column style={{ width: '40%', paddingRight: '8px' }}>
                  <Text style={{ margin: '0', fontSize: '13px', color: '#a1a1aa' }}>
                    Correo electrónico:
                  </Text>
                </Column>
                <Column>
                  <Text
                    style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#ffffff',
                      fontWeight: '600',
                    }}
                  >
                    {correoInstitucional || correoPersonal}
                  </Text>
                </Column>
              </Row>

              {password && (
                <Row style={{ marginBottom: '16px' }}>
                  <Column style={{ width: '40%', paddingRight: '8px' }}>
                    <Text style={{ margin: '0', fontSize: '13px', color: '#a1a1aa' }}>
                      Contraseña:
                    </Text>
                  </Column>
                  <Column>
                    <Text
                      style={{
                        margin: '0',
                        fontSize: '14px',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {password}
                    </Text>
                  </Column>
                </Row>
              )}

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
                <Link
                  href={loginUrl}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    padding: '12px 20px',
                    borderRadius: '4px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Iniciar Sesión
                </Link>
                <Text style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                  Enlace directo:{' '}
                  <Link href={loginUrl} style={{ color: '#a1a1aa', textDecoration: 'underline' }}>
                    {loginUrl}
                  </Link>
                </Text>
              </div>
            </div>
          </Section>

          {/* Seccion: Resumen de datos (Tabla Gris Diferenciada) */}
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
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: '#e4e4e7', margin: '0 32px 24px 32px' }} />

          {/* Footer */}
          <Section style={{ padding: '0 32px 32px 32px', textAlign: 'center' }}>
            <Text style={{ fontSize: '11px', color: '#a1a1aa', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              © KNOTEN. TODOS LOS DERECHOS RESERVADOS.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

