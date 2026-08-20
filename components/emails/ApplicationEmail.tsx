import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
} from 'react-email'

interface Props {
  freelancerNombre: string
  oficinaNombre: string
  vacanteRoles: string[]
}

export function ApplicationEmail({ freelancerNombre, oficinaNombre, vacanteRoles }: Props) {
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
              Confirmación de postulación
            </Text>
          </Section>

          {/* Main message */}
          <Section style={{ marginBottom: '24px' }}>
            <Text
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111111',
                margin: '0 0 8px 0',
              }}
            >
              ¡Postulación enviada!
            </Text>
            <Text style={{ color: '#6b7280', margin: '0', lineHeight: '1.6', fontSize: '14px' }}>
              Hola, {freelancerNombre}. Tu postulación a{' '}
              <span style={{ fontWeight: '600', color: '#111111' }}>{oficinaNombre}</span> fue
              recibida correctamente.
            </Text>
          </Section>

          <Hr style={{ borderColor: '#f3f4f6', margin: '24px 0' }} />

          {/* Roles */}
          {vacanteRoles.length > 0 && (
            <Section style={{ marginBottom: '24px' }}>
              <Text
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Roles solicitados
              </Text>
              {vacanteRoles.map((rol) => (
                <Text key={rol} style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#111111' }}>
                  • {rol}
                </Text>
              ))}
            </Section>
          )}

          <Hr style={{ borderColor: '#f3f4f6', margin: '24px 0' }} />

          {/* What's next */}
          <Section style={{ marginBottom: '24px' }}>
            <Text
              style={{
                fontSize: '13px',
                color: '#374151',
                margin: '0 0 8px 0',
                fontWeight: '600',
              }}
            >
              ¿Qué sigue?
            </Text>
            <Text style={{ fontSize: '13px', color: '#6b7280', margin: '0', lineHeight: '1.6' }}>
              El director de área revisará tu perfil y los materiales que enviaste. Recibirás una
              notificación cuando tome una decisión. Puedes consultar el estado de tu postulación
              en cualquier momento desde tu panel de Knoten.
            </Text>
          </Section>

          {/* Footer */}
          <Section>
            <Text style={{ fontSize: '11px', color: '#9ca3af', margin: '0', lineHeight: '1.6' }}>
              Este correo fue enviado automáticamente por Knoten. No respondas a este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
