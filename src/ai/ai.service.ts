
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import { LugaresService } from '../lugares/lugares.service.js';

export interface FiltrosIA {
  ciudad: string | null;
  categoria: string | null;
  calificacionMinima: number | null;
  precioMaximo: number | null;
}

@Injectable()
export class AiService {
  private readonly gemini: GoogleGenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly lugaresService: LugaresService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    // La aplicación puede funcionar con reglas locales
    // aunque no exista una clave de Gemini.
    if (apiKey) {
      this.gemini = new GoogleGenAI({ apiKey });
    } else {
      console.warn(
        'GEMINI_API_KEY no configurada. Se utilizarán reglas locales.',
      );
    }
  }

  // Normaliza el texto para reconocer palabras con o sin tildes.
  private normalizar(texto: string): string {
    return texto
      .toLocaleLowerCase('es-CO')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Interpreta consultas sin depender de un servicio externo.
  private interpretarConsultaLocal(query: string): FiltrosIA {
    const texto = this.normalizar(query);

    let ciudad: string | null = null;
    let categoria: string | null = null;
    let calificacionMinima: number | null = null;
    let precioMaximo: number | null = null;

    // Ciudades reconocidas.
    const ciudades = [
      { nombre: 'Bogotá', palabras: ['bogota', 'bogota dc'] },
      { nombre: 'Medellín', palabras: ['medellin'] },
      { nombre: 'Cartagena', palabras: ['cartagena'] },
      { nombre: 'Cali', palabras: ['cali'] },
      { nombre: 'Barranquilla', palabras: ['barranquilla'] },
      { nombre: 'Santa Marta', palabras: ['santa marta'] },
      { nombre: 'Villa de Leyva', palabras: ['villa de leyva'] },
      { nombre: 'San Andrés', palabras: ['san andres'] },
      { nombre: 'Pereira', palabras: ['pereira'] },
      { nombre: 'Bucaramanga', palabras: ['bucaramanga'] },
    ];

    for (const item of ciudades) {
      if (item.palabras.some((palabra) => texto.includes(palabra))) {
        ciudad = item.nombre;
        break;
      }
    }

    // Categoría turística.
    if (
      /\bmuseo(s)?\b/.test(texto) ||
      /\bgaleria(s)?\b/.test(texto)
    ) {
      categoria = 'Museo';
    } else if (
      /\bgastronomia\b|\bcomida\b|\brestaurante(s)?\b|\bcomer\b/.test(texto)
    ) {
      categoria = 'Gastronomía';
    } else if (
      /\baventura\b|\bextremo\b|\bdeportes extremos\b/.test(texto)
    ) {
      categoria = 'Aventura';
    } else if (
      /\bnaturaleza\b|\bparque(s)? naturales?\b|\bsenderismo\b|\bmontana(s)?\b/.test(texto)
    ) {
      categoria = 'Naturaleza';
    } else if (
      /\bcultura\b|\bhistorico(s)?\b|\bhistorica(s)?\b|\bmonumento(s)?\b/.test(texto)
    ) {
      categoria = 'Cultura';
    }

    // Consultas gratuitas.
    if (
      /\bgratis\b|\bgratuito(s)?\b|\bgratuita(s)?\b|\bsin costo\b|\bno cuesta\b/.test(texto)
    ) {
      precioMaximo = 0;
    } else {
      // Reconocer precios como "menos de 20000 pesos".
      const precioCoincide = texto.match(
        /(?:menos de|hasta|maximo de|por debajo de)\s*\$?\s*([\d.,]+)\s*(?:pesos|cop)?/i,
      );

      if (precioCoincide) {
        const valor = Number(
          precioCoincide[1].replace(/[.,]/g, ''),
        );

        if (Number.isFinite(valor) && valor >= 0) {
          precioMaximo = valor;
        }
      }
    }

    // Calificación: "más de 4 estrellas", "mínimo 4.5",
    // "superior a 4", "al menos 4 estrellas".
    const calificacionCoincide = texto.match(
      /(?:calificacion(?:es)?(?:\s+minima)?|superior\s+a|mas\s+de|mayor\s+que|al\s+menos|minimo(?:\s+de)?)\s*(?:\s*de\s*)?([0-5](?:[.,][0-9]+)?)\s*(?:estrellas?)?/i,
    );

    if (calificacionCoincide) {
      const valor = Number(
        calificacionCoincide[1].replace(',', '.'),
      );

      if (Number.isFinite(valor) && valor >= 0 && valor <= 5) {
        calificacionMinima = valor;
      }
    }

    return {
      ciudad,
      categoria,
      calificacionMinima,
      precioMaximo,
    };
  }

  // Consulta Gemini. Si falla, processQuery utilizará las reglas locales.
  private async interpretarConGemini(
    query: string,
  ): Promise<FiltrosIA> {
    if (!this.configService.get<string>('GEMINI_API_KEY')) {
      throw new Error('Gemini no está configurado.');
    }

    const respuesta = await this.gemini.interactions.create({
      model: 'gemini-3.8-flash',
      input: `
Analiza la siguiente consulta turística de Colombia:
"${query}"

Devuelve exclusivamente un JSON con estas propiedades:
- ciudad: ciudad mencionada o null.
- categoria: Museo, Naturaleza, Cultura, Gastronomía, Aventura o null.
- calificacionMinima: número entre 0 y 5 o null.
- precioMaximo: precio máximo en pesos colombianos o null.

Reglas:
- Si dice gratis, gratuito o sin costo, precioMaximo debe ser 0.
- Si dice más de 4 estrellas o superior a 4 estrellas,
  calificacionMinima debe ser 4.
- Si dice al menos 4.5 estrellas, calificacionMinima debe ser 4.5.
- No inventes filtros.
      `,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: {
            ciudad: { type: ['string', 'null'] },
            categoria: { type: ['string', 'null'] },
            calificacionMinima: { type: ['number', 'null'] },
            precioMaximo: { type: ['number', 'null'] },
          },
          required: [
            'ciudad',
            'categoria',
            'calificacionMinima',
            'precioMaximo',
          ],
        },
      },
    });

    const contenido = respuesta.output_text;

    if (!contenido) {
      throw new Error('Gemini devolvió una respuesta vacía.');
    }

    const filtros = JSON.parse(contenido) as FiltrosIA;

    if (
      filtros.ciudad !== null &&
      typeof filtros.ciudad !== 'string'
    ) {
      throw new Error('La ciudad recibida no es válida.');
    }

    const categoriasPermitidas = [
      'Museo',
      'Naturaleza',
      'Cultura',
      'Gastronomía',
      'Aventura',
    ];

    if (
      filtros.categoria !== null &&
      !categoriasPermitidas.includes(filtros.categoria)
    ) {
      filtros.categoria = null;
    }

    if (
      filtros.calificacionMinima !== null &&
      (
        typeof filtros.calificacionMinima !== 'number' ||
        !Number.isFinite(filtros.calificacionMinima) ||
        filtros.calificacionMinima < 0 ||
        filtros.calificacionMinima > 5
      )
    ) {
      throw new Error('La calificación recibida no es válida.');
    }

    if (
      filtros.precioMaximo !== null &&
      (
        typeof filtros.precioMaximo !== 'number' ||
        !Number.isFinite(filtros.precioMaximo) ||
        filtros.precioMaximo < 0
      )
    ) {
      throw new Error('El precio máximo recibido no es válido.');
    }

    return filtros;
  }

  async processQuery(query: string): Promise<{
    consulta: string;
    modo: string;
    filtros: FiltrosIA;
    cantidad: number;
    lugares: Awaited<
      ReturnType<LugaresService['buscarConFiltros']>
    >;
  }> {
    if (!query?.trim()) {
      throw new BadRequestException(
        'Debes escribir una consulta turística.',
      );
    }

    let filtros: FiltrosIA;
    let modo = 'gemini';

    try {
      filtros = await this.interpretarConGemini(query.trim());
      console.log('Consulta interpretada por Gemini:', filtros);
    } catch (error) {
      // El error de Gemini no impide continuar la búsqueda.
      console.warn(
        'Gemini no está disponible. Se usarán reglas locales.',
        error instanceof Error ? error.message : error,
      );

      filtros = this.interpretarConsultaLocal(query.trim());
      modo = 'reglas-locales';

      console.log('Filtros interpretados localmente:', filtros);
    }

    try {
      const lugares = await this.lugaresService.buscarConFiltros(
        filtros.ciudad ?? undefined,
        filtros.categoria ?? undefined,
        filtros.calificacionMinima ?? undefined,
        filtros.precioMaximo ?? undefined,
      );

      return {
        consulta: query.trim(),
        modo,
        filtros,
        cantidad: lugares.length,
        lugares,
      };
    } catch (error) {
      console.error('Error consultando los lugares en MySQL:', error);

      throw new InternalServerErrorException(
        'No se pudieron consultar los lugares en MySQL. Verifica la conexión y los filtros.',
      );
    }
  }
}
