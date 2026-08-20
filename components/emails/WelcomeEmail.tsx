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
} from 'react-email'

interface Props {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  numeroCuenta: string
  correoInstitucional: string
  correoPersonal: string
  telefono: string
}

export function WelcomeEmail({
  nombre,
  apellidoPaterno,
  apellidoMaterno,
  numeroCuenta,
  correoInstitucional,
  correoPersonal,
  telefono,
}: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'sans-serif', margin: '0', padding: '0' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          {/* Header */}
          <Section style={{ marginBottom: '32px' }}>
            <Heading
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111111',
                margin: '0 0 4px 0',
                letterSpacing: '-0.5px',
              }}
            >
              Knoten
            </Heading>
            <Text style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
              Confirmación de registro
            </Text>
          </Section>

          {/* Greeting */}
          <Section style={{ marginBottom: '24px' }}>
            <Text
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111111',
                margin: '0 0 8px 0',
              }}
            >
              Bienvenido, {nombre} {apellidoPaterno}
            </Text>
            <Text style={{ color: '#6b7280', margin: '0', lineHeight: '1.6', fontSize: '14px' }}>
              Tu cuenta ha sido creada exitosamente en Knoten. Revisa el resumen de tus datos a
              continuación y confirma tu correo electrónico para activar tu cuenta.
            </Text>
          </Section>

          <Hr style={{ borderColor: '#f3f4f6', margin: '24px 0' }} />

          {/* Data Summary */}
          <Section style={{ marginBottom: '24px' }}>
            <Text
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 16px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Resumen de datos
            </Text>

            {(
              [
                ['Nombre completo', `${nombre} ${apellidoPaterno} ${apellidoMaterno}`],
                ['Número de cuenta UNAM', numeroCuenta],
                ['Correo institucional', correoInstitucional],
                ['Correo personal', correoPersonal],
                ['Teléfono', telefono],
              ] as [string, string][]
            ).map(([label, val]) => (
              <Row key={label} style={{ marginBottom: '10px' }}>
                <Column style={{ width: '45%', paddingRight: '12px' }}>
                  <Text style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                    {label}
                  </Text>
                </Column>
                <Column>
                  <Text
                    style={{
                      margin: '0',
                      fontSize: '13px',
                      color: '#111111',
                      fontWeight: '500',
                    }}
                  >
                    {val}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={{ borderColor: '#f3f4f6', margin: '24px 0' }} />

          {/* Next steps */}
          <Section style={{ marginBottom: '24px' }}>
            <Text
              style={{
                fontSize: '13px',
                color: '#374151',
                margin: '0 0 8px 0',
                fontWeight: '600',
              }}
            >
              Próximos pasos
            </Text>
            <Text style={{ fontSize: '13px', color: '#6b7280', margin: '0', lineHeight: '1.6' }}>
              1. Confirma tu correo electrónico haciendo clic en el enlace de activación que te
              enviamos.
              <br />
              2. Selecciona tu rol (Freelancer o Director de área).
              <br />
              3. Completa tu perfil y comienza a conectar con proyectos.
            </Text>
          </Section>

          {/* Footer */}
          <Section>
            <Text
              style={{ fontSize: '11px', color: '#9ca3af', margin: '0', lineHeight: '1.6' }}
            >
              Este correo fue enviado automáticamente por Knoten. Si no creaste esta cuenta,
              puedes ignorar este mensaje de forma segura.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
