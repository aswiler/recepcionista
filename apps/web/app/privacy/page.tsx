import Link from 'next/link'
import { Phone, Shield, Mail, FileText, Lock, Eye, Database, Users, Globe } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidad | Recepcionista.com',
  description: 'Política de privacidad y protección de datos de Recepcionista.com conforme al RGPD',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="relative max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-6">
            ← Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Política de Privacidad</h1>
          </div>
          <p className="text-blue-200 text-lg">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" />
              1. Introducción
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                En <strong className="text-white">Recepcionista.com</strong> ("nosotros", "nuestro", "la Plataforma"), 
                nos comprometemos a proteger y respetar tu privacidad. Esta Política de Privacidad explica cómo 
                recopilamos, utilizamos, divulgamos y protegemos tu información personal cuando utilizas nuestro 
                servicio de recepcionista con inteligencia artificial.
              </p>
              <p>
                Esta política cumple con el <strong className="text-white">Reglamento General de Protección de Datos (RGPD)</strong> 
                de la Unión Europea y la <strong className="text-white">Ley Orgánica 3/2018 de Protección de Datos Personales 
                y garantía de los derechos digitales</strong> de España.
              </p>
            </div>
          </section>

          {/* Data Controller */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-400" />
              2. Responsable del Tratamiento
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                <strong className="text-white">Responsable:</strong> Recepcionista.com
              </p>
              <p>
                <strong className="text-white">Dirección:</strong> [Dirección completa de la empresa]
              </p>
              <p>
                <strong className="text-white">Email de contacto:</strong>{' '}
                <a href="mailto:privacidad@recepcionista.com" className="text-blue-400 hover:text-blue-300 underline">
                  privacidad@recepcionista.com
                </a>
              </p>
              <p>
                Si tienes preguntas sobre esta política o sobre cómo tratamos tus datos personales, 
                puedes contactarnos en cualquier momento.
              </p>
            </div>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-400" />
              3. Datos que Recopilamos
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">3.1. Datos de Cuenta</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nombre completo</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Número de teléfono</li>
                  <li>Contraseña (encriptada)</li>
                  <li>Información de facturación (si aplica)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">3.2. Datos de tu Negocio</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nombre del negocio</li>
                  <li>Descripción de servicios</li>
                  <li>Información extraída de tu sitio web</li>
                  <li>Horarios de atención</li>
                  <li>Precios y catálogo de servicios</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">3.3. Datos de Comunicación</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Grabaciones de llamadas telefónicas</li>
                  <li>Transcripciones de conversaciones</li>
                  <li>Mensajes de WhatsApp</li>
                  <li>Historial de conversaciones con clientes</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">3.4. Datos Técnicos</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Dirección IP</li>
                  <li>Tipo de navegador y dispositivo</li>
                  <li>Cookies y tecnologías similares</li>
                  <li>Registros de uso de la plataforma</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-blue-400" />
              4. Base Legal para el Tratamiento
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>Tratamos tus datos personales basándonos en las siguientes bases legales:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">Ejecución del contrato:</strong> Para proporcionarte 
                  el servicio de recepcionista AI y cumplir con nuestros términos de servicio.
                </li>
                <li>
                  <strong className="text-white">Consentimiento:</strong> Cuando nos has dado tu 
                  consentimiento explícito (por ejemplo, para marketing).
                </li>
                <li>
                  <strong className="text-white">Interés legítimo:</strong> Para mejorar nuestros 
                  servicios, prevenir fraudes y garantizar la seguridad.
                </li>
                <li>
                  <strong className="text-white">Obligación legal:</strong> Para cumplir con 
                  obligaciones legales y regulatorias.
                </li>
              </ul>
            </div>
          </section>

          {/* Purpose */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-400" />
              5. Finalidad del Tratamiento
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>Utilizamos tus datos personales para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Proporcionar y mantener nuestro servicio de recepcionista AI</li>
                <li>Procesar y responder a llamadas y mensajes de tus clientes</li>
                <li>Gestionar tu cuenta y facturación</li>
                <li>Enviarte notificaciones sobre el servicio</li>
                <li>Mejorar y personalizar tu experiencia</li>
                <li>Detectar y prevenir fraudes o actividades ilegales</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Enviarte comunicaciones de marketing (solo con tu consentimiento)</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-400" />
              6. Compartir Datos con Terceros
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>Podemos compartir tus datos personales con:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">Proveedores de servicios:</strong> Empresas que nos 
                  ayudan a operar (hosting, procesamiento de pagos, análisis). Todos están obligados 
                  contractualmente a proteger tus datos.
                </li>
                <li>
                  <strong className="text-white">Integraciones:</strong> Servicios que conectas 
                  voluntariamente (Google Calendar, Outlook, WhatsApp Business API).
                </li>
                <li>
                  <strong className="text-white">Autoridades legales:</strong> Cuando sea requerido 
                  por ley o para proteger nuestros derechos legales.
                </li>
              </ul>
              <p className="mt-4">
                <strong className="text-white">No vendemos ni alquilamos tus datos personales</strong> a 
                terceros para sus propios fines de marketing.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Conservación de Datos
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                Conservamos tus datos personales solo durante el tiempo necesario para cumplir con 
                los fines descritos en esta política, a menos que la ley requiera un período de 
                conservación más largo.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Datos de cuenta:</strong> Mientras tu cuenta esté activa</li>
                <li><strong className="text-white">Grabaciones de llamadas:</strong> 90 días (o según tu plan)</li>
                <li><strong className="text-white">Transcripciones:</strong> 2 años para mejorar el servicio</li>
                <li><strong className="text-white">Datos de facturación:</strong> Según obligaciones fiscales (mínimo 6 años)</li>
              </ul>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. Tus Derechos (RGPD)
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-4">
              <p>Bajo el RGPD, tienes los siguientes derechos:</p>
              
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">8.1. Derecho de Acceso</h3>
                  <p>Puedes solicitar una copia de todos los datos personales que tenemos sobre ti.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">8.2. Derecho de Rectificación</h3>
                  <p>Puedes corregir cualquier dato inexacto o incompleto.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">8.3. Derecho de Supresión ("Derecho al Olvido")</h3>
                  <p>Puedes solicitar que eliminemos tus datos personales en ciertas circunstancias.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">8.4. Derecho a la Limitación del Tratamiento</h3>
                  <p>Puedes solicitar que limitemos cómo procesamos tus datos.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">8.5. Derecho a la Portabilidad</h3>
                  <p>Puedes recibir tus datos en un formato estructurado y transferirlos a otro proveedor.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">8.6. Derecho de Oposición</h3>
                  <p>Puedes oponerte al tratamiento de tus datos para ciertos fines (por ejemplo, marketing).</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">8.7. Derecho a Retirar el Consentimiento</h3>
                  <p>Puedes retirar tu consentimiento en cualquier momento cuando el tratamiento se base en consentimiento.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">8.8. Derecho a Presentar una Reclamación</h3>
                  <p>
                    Tienes derecho a presentar una reclamación ante la{' '}
                    <a 
                      href="https://www.aepd.es" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Agencia Española de Protección de Datos (AEPD)
                    </a>
                    {' '}si consideras que hemos violado tus derechos.
                  </p>
                </div>
              </div>
              
              <p className="mt-4">
                Para ejercer cualquiera de estos derechos, contáctanos en{' '}
                <a href="mailto:privacidad@recepcionista.com" className="text-blue-400 hover:text-blue-300 underline">
                  privacidad@recepcionista.com
                </a>
                . Responderemos en un plazo máximo de un mes.
              </p>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-400" />
              9. Seguridad de los Datos
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos 
                personales contra acceso no autorizado, alteración, divulgación o destrucción:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encriptación de datos en tránsito (TLS/SSL)</li>
                <li>Encriptación de datos en reposo</li>
                <li>Controles de acceso estrictos</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Copias de seguridad regulares</li>
                <li>Auditorías de seguridad periódicas</li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              10. Cookies y Tecnologías Similares
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia. Puedes gestionar 
                tus preferencias de cookies en la configuración de tu navegador. Para más información, 
                consulta nuestra{' '}
                <Link href="/cookies" className="text-blue-400 hover:text-blue-300 underline">
                  Política de Cookies
                </Link>
                .
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              11. Transferencias Internacionales
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio 
                Económico Europeo (EEE). Cuando transferimos datos fuera del EEE, nos aseguramos de 
                que existan salvaguardas adecuadas, como:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cláusulas contractuales estándar aprobadas por la Comisión Europea</li>
                <li>Certificaciones de adecuación (por ejemplo, Privacy Shield para EE.UU.)</li>
                <li>Otros mecanismos legales apropiados</li>
              </ul>
            </div>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              12. Menores de Edad
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                Nuestro servicio está dirigido a empresas y profesionales. No recopilamos intencionalmente 
                datos personales de menores de 16 años. Si descubrimos que hemos recopilado datos de un 
                menor sin el consentimiento de los padres, tomaremos medidas para eliminar esa información 
                inmediatamente.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              13. Cambios a esta Política
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos de 
                cualquier cambio significativo publicando la nueva política en esta página y actualizando 
                la fecha de "Última actualización". Te recomendamos que revises esta política periódicamente.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-400" />
              14. Contacto
            </h2>
            <div className="text-blue-100 leading-relaxed space-y-3">
              <p>
                Si tienes preguntas, preocupaciones o deseas ejercer tus derechos bajo el RGPD, 
                puedes contactarnos:
              </p>
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <p>
                  <strong className="text-white">Email:</strong>{' '}
                  <a href="mailto:privacidad@recepcionista.com" className="text-blue-400 hover:text-blue-300 underline">
                    privacidad@recepcionista.com
                  </a>
                </p>
                <p>
                  <strong className="text-white">Asunto:</strong> "Consulta RGPD" o "Ejercicio de Derechos"
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
