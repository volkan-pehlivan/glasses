/**
 * Lens shape configurations
 * Each shape has a generator key (matching SHAPE_GENERATORS), display info, and a widthRatio
 * for bridge width calculations in LensModel.
 */
import { SHAPE_GENERATORS } from './shapeGenerators'

export const SHAPE_CONFIGS = {
    rectangle: {
        generator: SHAPE_GENERATORS.rectangle,
        name: 'Dikdörtgen',
        desc: 'Keskin hatlar, minimal yuvarlak',
        widthRatio: 1.4
    },
    square: {
        generator: SHAPE_GENERATORS.square,
        name: 'Kare',
        desc: 'Eşit kenarlı kare',
        widthRatio: 1.0
    },
    wayfarer: {
        generator: SHAPE_GENERATORS.wayfarer,
        name: 'Wayfarer',
        desc: 'Üstte geniş, altta dar',
        widthRatio: 1.35
    },
    aviator: {
        generator: SHAPE_GENERATORS.aviator,
        name: 'Aviator',
        desc: 'Damla şekli, altta geniş',
        widthRatio: 1.3
    },
    pilot: {
        generator: SHAPE_GENERATORS.pilot,
        name: 'Pilot',
        desc: 'Büyük damla, köşeli hatlar',
        widthRatio: 1.4
    },
    clubmaster: {
        generator: SHAPE_GENERATORS.clubmaster,
        name: 'Clubmaster',
        desc: 'Düz üst, yuvarlak alt',
        widthRatio: 1.3
    },
    catEye: {
        generator: SHAPE_GENERATORS.catEye,
        name: 'Kedi Gözü',
        desc: 'Yukarı kıvrık dış köşeler',
        widthRatio: 1.3
    },
    navigator: {
        generator: SHAPE_GENERATORS.navigator,
        name: 'Navigator',
        desc: 'Geniş dikdörtgen, hafif eğri',
        widthRatio: 1.5
    },
    catEyeNarrow: {
        generator: SHAPE_GENERATORS.catEyeNarrow,
        name: 'Dar Kedi Gözü',
        desc: 'Dar kedi gözü çerçeve',
        widthRatio: 1.2
    },
    round: {
        generator: SHAPE_GENERATORS.round,
        name: 'Yuvarlak',
        desc: 'Mükemmel daire',
        widthRatio: 1.0
    },
    oval: {
        generator: SHAPE_GENERATORS.oval,
        name: 'Oval',
        desc: 'Yatay elips',
        widthRatio: 1.3
    },
    pantos: {
        generator: SHAPE_GENERATORS.pantos,
        name: 'Pantos',
        desc: 'Yuvarlak alt, düz üst',
        widthRatio: 1.1
    },
    geometric: {
        generator: SHAPE_GENERATORS.geometric,
        name: 'Geometrik',
        desc: 'Altıgen köşeli şekil',
        widthRatio: 1.0
    },
    butterfly: {
        generator: SHAPE_GENERATORS.butterfly,
        name: 'Kelebek',
        desc: 'Geniş dış, dar iç kenarlar',
        widthRatio: 1.4
    },
    hexagonal: {
        generator: SHAPE_GENERATORS.hexagonal,
        name: 'Altıgen',
        desc: 'Altı kenarlı çerçeve',
        widthRatio: 1.0
    },
    octagonal: {
        generator: SHAPE_GENERATORS.octagonal,
        name: 'Sekizgen',
        desc: 'Sekiz kenarlı çerçeve',
        widthRatio: 1.0
    },
    realShape1: {
        generator: SHAPE_GENERATORS.realShape1,
        name: 'Gerçek Şekil 1',
        desc: 'PNG\'den çıkarılmış gerçek çerçeve',
        widthRatio: 1.0
    },
    realShape1Raw: {
        generator: SHAPE_GENERATORS.realShape1Raw,
        name: 'Gerçek Şekil 1 (Keskin)',
        desc: 'Yumuşatma yapılmamış ham şekil',
        widthRatio: 1.0
    },
    realShape1Sharp: {
        generator: SHAPE_GENERATORS.realShape1Sharp,
        name: 'Gerçek Şekil 1 (Net)',
        desc: 'Optimize edilmiş net hatlar',
        widthRatio: 1.0
    },
    realShape2: {
        generator: SHAPE_GENERATORS.realShape2,
        name: 'Gerçek Şekil 2',
        desc: 'İkinci lens şekli',
        widthRatio: 1.0
    },
    realShape3: {
        generator: SHAPE_GENERATORS.realShape3,
        name: 'Gerçek Şekil 3 (lenses03)',
        desc: 'Üçüncü lens şekli',
        widthRatio: 1.0
    },
    realShape4: {
        generator: SHAPE_GENERATORS.realShape4,
        name: 'Gerçek Şekil 4 (lenses04)',
        desc: 'Dördüncü lens şekli',
        widthRatio: 1.0
    },
    realShape5: {
        generator: SHAPE_GENERATORS.realShape5,
        name: 'Gerçek Şekil 5 (lenses05)',
        desc: 'Beşinci lens şekli',
        widthRatio: 1.0
    },
    realShape6: {
        generator: SHAPE_GENERATORS.realShape6,
        name: 'Gerçek Şekil 6 (lenses06)',
        desc: 'Altıncı lens şekli',
        widthRatio: 1.0
    },
    realShape7: {
        generator: SHAPE_GENERATORS.realShape7,
        name: 'Gerçek Şekil 7 (lenses07)',
        desc: 'Yedinci lens şekli',
        widthRatio: 1.0
    },
    realShape8: {
        generator: SHAPE_GENERATORS.realShape8,
        name: 'Gerçek Şekil 8 (lenses08)',
        desc: 'Sekizinci lens şekli',
        widthRatio: 1.0
    },
    realShape9: {
        generator: SHAPE_GENERATORS.realShape9,
        name: 'Gerçek Şekil 9 (lenses09)',
        desc: 'Dokuzuncu lens şekli',
        widthRatio: 1.0
    },
    realShape10: {
        generator: SHAPE_GENERATORS.realShape10,
        name: 'Gerçek Şekil 10 (lenses10)',
        desc: 'Onuncu lens şekli',
        widthRatio: 1.0
    },
    realShape11: {
        generator: SHAPE_GENERATORS.realShape11,
        name: 'Gerçek Şekil 11 (lenses11)',
        desc: 'On birinci lens şekli',
        widthRatio: 1.0
    },
    realShape12: {
        generator: SHAPE_GENERATORS.realShape12,
        name: 'Gerçek Şekil 12 (lenses12)',
        desc: 'On ikinci lens şekli',
        widthRatio: 1.0
    },
    realShape13: {
        generator: SHAPE_GENERATORS.realShape13,
        name: 'Gerçek Şekil 13 (lenses13)',
        desc: 'On üçüncü lens şekli',
        widthRatio: 1.0
    },
    realShape14: {
        generator: SHAPE_GENERATORS.realShape14,
        name: 'Gerçek Şekil 14 (lenses14)',
        desc: 'On dördüncü lens şekli',
        widthRatio: 1.0
    },
    realShape15: {
        generator: SHAPE_GENERATORS.realShape15,
        name: 'Gerçek Şekil 15 (lenses15)',
        desc: 'On beşinci lens şekli',
        widthRatio: 1.0
    },
    realShape16: {
        generator: SHAPE_GENERATORS.realShape16,
        name: 'Gerçek Şekil 16 (lenses16)',
        desc: 'On altıncı lens şekli',
        widthRatio: 1.0
    }
}
