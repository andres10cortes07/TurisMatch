
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CalificacionesModule } from './calificaciones/calificaciones.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { FavoritosModule } from './favoritos/favoritos.module.js';
import { LugaresModule } from './lugares/lugares.module.js';
import { PlanesModule } from './planes/planes.module.js';
import { PreferenciasModule } from './preferencias/preferencias.module.js';
import { SitiosModule } from './sitios/sitios.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    // Cargar las variables de entorno desde el archivo .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuración de la conexión a MySQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'turismo_ia'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    AiModule,
    AuthModule,
    CalificacionesModule,
    CategoriasModule,
    FavoritosModule,
    LugaresModule,
    PlanesModule,
    PreferenciasModule,
    SitiosModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
