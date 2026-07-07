import * as vscode from 'vscode';

const translations: { [locale: string]: { [key: string]: string } } = {
    ko: {
        "warning.javaOnly": "Java 에디터에서만 사용할 수 있습니다.",
        "warning.noWord": "커서가 위치한 단어를 찾을 수 없습니다.",
        "warning.noMapperVar": "Mapper 변수명을 추출할 수 없습니다. (beforeWord: \"{0}\")",
        "progress.searching": "MyBatis XML 검색 중...",
        "info.xmlFoundNoQuery": "XML 매퍼는 찾았으나 ID: \"{0}\" 쿼리를 찾을 수 없습니다.",
        "error.xmlNotFound": "MyBatis XML 매퍼를 찾을 수 없습니다. (타입: {0})",
        "error.jumpFailed": "점프 오류: {0}",
        "warning.cannotIdentifyMapper": "Mapper 인터페이스 타입을 식별할 수 없습니다."
    },
    en: {
        "warning.javaOnly": "This command can only be used in Java editors.",
        "warning.noWord": "Cannot find the word at the cursor position.",
        "warning.noMapperVar": "Cannot extract Mapper variable name. (beforeWord: \"{0}\")",
        "progress.searching": "Searching for MyBatis XML...",
        "info.xmlFoundNoQuery": "XML Mapper was found, but query ID: \"{0}\" was not found.",
        "error.xmlNotFound": "Cannot find MyBatis XML Mapper. (Type: {0})",
        "error.jumpFailed": "Jump error: {0}",
        "warning.cannotIdentifyMapper": "Cannot identify Mapper interface type."
    }
};

/**
 * 현재 IDE 언어 설정에 적합한 번역 메시지를 조회하고, 자리표시자({0}, {1} 등)를 치환하여 반환합니다.
 */
export function t(key: string, ...args: any[]): string {
    const locale = vscode.env.language || 'en';
    const translationMap = translations[locale.startsWith('ko') ? 'ko' : 'en'];
    let text = translationMap[key] || translations['en'][key] || key;

    if (args.length > 0) {
        args.forEach((val, idx) => {
            text = text.replace(new RegExp(`\\{${idx}\\}`, 'g'), String(val));
        });
    }

    return text;
}
