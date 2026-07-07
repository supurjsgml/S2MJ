/**
 * S2MJ 익스텐션에서 사용하는 정규식 및 문자열 관련 상수 정의
 */

// 정적 정규식 상수
export const REGEX = {
    // 변수 또는 메서드의 마지막 단어(식별자) 추출
    LAST_IDENTIFIER: /([a-zA-Z0-9_$]+)$/,

    // 자바 파일 내 interface 선언 및 이름 추출
    JAVA_INTERFACE_DECLARATION: /\binterface\s+([A-Z][a-zA-Z0-9_$]*)\b/,

    // MyBatis XML 내 <mapper namespace="..."> 추출
    XML_MAPPER_NAMESPACE: /<\s*mapper\s+namespace\s*=\s*["']([^"']+)["']/,

    // XML 라인 내 namespace 속성 추출
    XML_LINE_NAMESPACE: /namespace\s*=\s*["']([^"']+)["']/
};

// 동적 정규식 생성 팩토리 함수
export const REGEX_FACTORY = {
    // 특정 변수명(mapperVarName)에 대한 타입을 추출하기 위한 정규식 생성
    createJavaTypeFinder(mapperVarName: string): RegExp {
        return new RegExp(`\\b([A-Z][a-zA-Z0-9_$]*)\\b\\s+${mapperVarName}\\b`);
    },

    // XML 내부에서 특정 쿼리 ID(methodName) 태그 라인을 매칭하기 위한 정규식 생성
    createXmlQueryIdFinder(methodName: string): RegExp {
        return new RegExp(`<\\s*(select|insert|update|delete|statement)\\b[^>]*\\bid\\s*=\\s*["']${methodName}["']`);
    },

    // 라인 내에 특정 id 속성이 존재하는지 확인하는 정규식 생성
    createXmlLineIdFinder(methodName: string): RegExp {
        return new RegExp(`id\\s*=\\s*["']${methodName}["']`);
    },

    // 자바 파일 내에서 특정 인터페이스 선언을 매칭하기 위한 정규식 생성
    createJavaInterfaceFinder(className: string): RegExp {
        return new RegExp(`\\binterface\\s+${className}\\b`);
    },

    // 자바 파일 내에서 특정 메서드 선언을 매칭하기 위한 정규식 생성
    createJavaMethodDeclarationFinder(methodName: string): RegExp {
        return new RegExp(`\\b${methodName}\\s*\\(`);
    }
};
