import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { REGEX, REGEX_FACTORY } from './constants';
import { t } from './i18n';

export function activate(context: vscode.ExtensionContext) {
    // 빌드 결과물(out/extension.js)이 변경되면 확장 호스트를 자동으로 재시작하여 변경 사항 즉시 반영
    let reloadTimeout: NodeJS.Timeout | undefined;
    const extensionJsPath = path.join(context.extensionPath, 'out', 'extension.js');
    if (fs.existsSync(extensionJsPath)) {
        const watcher = fs.watch(extensionJsPath, () => {
            if (reloadTimeout) {
                clearTimeout(reloadTimeout);
            }
            reloadTimeout = setTimeout(() => {
                vscode.commands.executeCommand('workbench.action.restartExtensionHost');
            }, 1000); // 파일 쓰기가 완전히 완료될 수 있도록 1초 대기 후 재시작
        });
        context.subscriptions.push({
            dispose: () => {
                watcher.close();
                if (reloadTimeout) {
                    clearTimeout(reloadTimeout);
                }
            }
        });
    }

    let disposable = vscode.commands.registerCommand('s2mj.jump', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'java') {
            vscode.window.showWarningMessage(t('warning.javaOnly'));
            return;
        }

        const position = editor.selection.active;
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            vscode.window.showWarningMessage(t('warning.noWord'));
            return;
        }

        const methodName = document.getText(wordRange);
        const lineText = document.lineAt(position.line).text;
        
        // 커서 위치 기준으로 메서드 호출 구조 또는 인터페이스 선언 분석
        const beforeWord = lineText.substring(0, wordRange.start.character).trim();
        let mapperTypeName = '';

        if (beforeWord.endsWith('.')) {
            // [경우 1] 메서드 호출 구조 (예: userMapper.selectUserById)
            const withoutDot = beforeWord.slice(0, -1).trim();
            const match = withoutDot.match(REGEX.LAST_IDENTIFIER);
            let mapperVarName = '';
            if (match) {
                mapperVarName = match[1];
            }

            if (!mapperVarName) {
                vscode.window.showWarningMessage(t('warning.noMapperVar', beforeWord));
                return;
            }

            // Java 파일 전체 텍스트에서 Mapper 인터페이스 타입 찾기
            const fullText = document.getText();
            const typeRegex = REGEX_FACTORY.createJavaTypeFinder(mapperVarName);
            const typeMatch = fullText.match(typeRegex);

            if (typeMatch) {
                mapperTypeName = typeMatch[1];
            } else {
                // 기본값 관례 적용 (예: userMapper -> UserMapper)
                mapperTypeName = mapperVarName.charAt(0).toUpperCase() + mapperVarName.slice(1);
            }
        } else {
            // [경우 2] Mapper 인터페이스 내부 메서드 선언부 (예: interface UserMapper 내의 selectUserById)
            const fullText = document.getText();
            const interfaceMatch = fullText.match(REGEX.JAVA_INTERFACE_DECLARATION);
            if (interfaceMatch) {
                mapperTypeName = interfaceMatch[1];
            } else {
                // 파일명에서 추출 시도
                const path = require('path');
                mapperTypeName = path.basename(document.fileName, '.java');
            }

            if (!mapperTypeName) {
                vscode.window.showWarningMessage(t('warning.cannotIdentifyMapper'));
                return;
            }
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: t('progress.searching'),
            cancellable: false
        }, async (progress) => {
            try {
                // 프로젝트 전체 XML 파일 검색
                const xmlFiles = await vscode.workspace.findFiles('**/*.xml', '**/node_modules/**', 1000);
                let targetXmlUri: vscode.Uri | undefined = undefined;
                let targetLineNumber = -1;

                for (const fileUri of xmlFiles) {
                    try {
                        const xmlData = await vscode.workspace.fs.readFile(fileUri);
                        const xmlContent = new TextDecoder('utf-8').decode(xmlData);

                        // XML 내부 <mapper namespace="..."> 분석
                        const namespaceMatch = xmlContent.match(REGEX.XML_MAPPER_NAMESPACE);
                        if (namespaceMatch) {
                            const namespace = namespaceMatch[1];
                            // namespace의 끝자리가 mapperTypeName과 일치하는지 확인
                            // 패키지명 포함 매칭 고려 (예: com.example.UserMapper)
                            if (namespace === mapperTypeName || namespace.endsWith('.' + mapperTypeName)) {
                                // 일치하는 매퍼 XML 발견!
                                // 해당 XML 안에서 쿼리 ID 매치
                                // <select id="methodName" ...
                                const lines = xmlContent.split(/\r?\n/);
                                const idRegex = REGEX_FACTORY.createXmlQueryIdFinder(methodName);
                                
                                for (let i = 0; i < lines.length; i++) {
                                    if (idRegex.test(lines[i])) {
                                        targetLineNumber = i;
                                        break;
                                    }
                                }
                                targetXmlUri = fileUri;
                                break;
                            }
                        }
                    } catch (e) {
                        // 개별 파일 읽기 오류는 무시하고 진행
                    }
                }

                if (targetXmlUri) {
                    const doc = await vscode.workspace.openTextDocument(targetXmlUri);
                    const xmlEditor = await vscode.window.showTextDocument(doc);
                    
                    if (targetLineNumber !== -1) {
                        const position = new vscode.Position(targetLineNumber, 0);
                        xmlEditor.selection = new vscode.Selection(position, position);
                        const range = new vscode.Range(position, position);
                        xmlEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                    } else {
                        vscode.window.showInformationMessage(t('info.xmlFoundNoQuery', methodName));
                    }
                } else {
                    vscode.window.showErrorMessage(t('error.xmlNotFound', mapperTypeName));
                }
            } catch (err: any) {
                vscode.window.showErrorMessage(t('error.jumpFailed', err.message));
            }
        });
    });

    context.subscriptions.push(disposable);

    // MyBatis XML에서 Java Mapper로 역방향 점프를 위한 DefinitionProvider 등록
    let definitionProvider = vscode.languages.registerDefinitionProvider(
        { language: 'xml', scheme: 'file' },
        {
            async provideDefinition(
                document: vscode.TextDocument,
                position: vscode.Position,
                token: vscode.CancellationToken
            ): Promise<vscode.Definition | undefined> {
                const lineText = document.lineAt(position.line).text;

                // [경우 1] mapper namespace 컨트롤+클릭 시 자바 매퍼 인터페이스 파일로 점프
                const namespaceLineMatch = lineText.match(REGEX.XML_LINE_NAMESPACE);
                if (namespaceLineMatch) {
                    const namespaceValue = namespaceLineMatch[1];
                    const startIdx = lineText.indexOf(namespaceValue);
                    const endIdx = startIdx + namespaceValue.length;

                    // 커서 위치가 namespace 값 문자열 범위 내에 있는 경우
                    if (position.character >= startIdx && position.character <= endIdx) {
                        const lastDot = namespaceValue.lastIndexOf('.');
                        const mapperClassName = lastDot !== -1 ? namespaceValue.substring(lastDot + 1) : namespaceValue;

                        // 프로젝트에서 mapperClassName.java 파일 검색
                        const javaFiles = await vscode.workspace.findFiles(`**/${mapperClassName}.java`, '**/node_modules/**', 10);
                        if (javaFiles.length > 0) {
                            const javaFileUri = javaFiles[0];
                            let targetLine = 0;
                            try {
                                const javaData = await vscode.workspace.fs.readFile(javaFileUri);
                                const javaContent = new TextDecoder('utf-8').decode(javaData);
                                const lines = javaContent.split(/\r?\n/);
                                const interfaceRegex = REGEX_FACTORY.createJavaInterfaceFinder(mapperClassName);
                                
                                for (let i = 0; i < lines.length; i++) {
                                    if (interfaceRegex.test(lines[i])) {
                                        targetLine = i;
                                        break;
                                    }
                                }
                            } catch (e) {}

                            return new vscode.Location(javaFileUri, new vscode.Position(targetLine, 0));
                        }
                    }
                }

                // [경우 2] 기존의 id="queryId" 매핑 자바 메서드 점프
                const wordRange = document.getWordRangeAtPosition(position);
                if (!wordRange) {
                    return undefined;
                }

                const methodName = document.getText(wordRange);

                // id="methodName" 또는 id='methodName' 형식인지 확인
                const idRegex = REGEX_FACTORY.createXmlLineIdFinder(methodName);
                if (!idRegex.test(lineText)) {
                    return undefined;
                }

                // XML 파일 전체 텍스트에서 mapper namespace 추출
                const xmlContent = document.getText();
                const namespaceMatch = xmlContent.match(REGEX.XML_MAPPER_NAMESPACE);
                if (!namespaceMatch) {
                    return undefined;
                }

                const namespace = namespaceMatch[1];
                // namespace에서 클래스/인터페이스 이름 추출 (예: com.example.mapper.UserMapper -> UserMapper)
                const lastDot = namespace.lastIndexOf('.');
                const mapperClassName = lastDot !== -1 ? namespace.substring(lastDot + 1) : namespace;

                // 프로젝트 전체에서 mapperClassName.java 파일 검색
                const javaFiles = await vscode.workspace.findFiles(`**/${mapperClassName}.java`, '**/node_modules/**', 10);
                if (javaFiles.length === 0) {
                    return undefined;
                }

                const targetLocations: vscode.Location[] = [];

                for (const javaFileUri of javaFiles) {
                    try {
                        const javaData = await vscode.workspace.fs.readFile(javaFileUri);
                        const javaContent = new TextDecoder('utf-8').decode(javaData);
                        const lines = javaContent.split(/\r?\n/);
                        // 메서드 선언 매칭 정규식: 예) Object selectUserById(String id);
                        const methodRegex = REGEX_FACTORY.createJavaMethodDeclarationFinder(methodName);

                        for (let i = 0; i < lines.length; i++) {
                            if (methodRegex.test(lines[i])) {
                                const charIndex = lines[i].indexOf(methodName);
                                const targetPosition = new vscode.Position(i, charIndex !== -1 ? charIndex : 0);
                                targetLocations.push(new vscode.Location(javaFileUri, targetPosition));
                                break;
                            }
                        }
                    } catch (e) {
                        // 에러 발생 시 건너뜀
                    }
                }

                return targetLocations.length > 0 ? targetLocations : undefined;
            }
        }
    );

    context.subscriptions.push(definitionProvider);

    // Java Mapper 메서드에서 MyBatis XML의 쿼리 위치를 참조 결과에 추가하는 ReferenceProvider 등록
    let referenceProvider = vscode.languages.registerReferenceProvider(
        { language: 'java', scheme: 'file' },
        {
            async provideReferences(
                document: vscode.TextDocument,
                position: vscode.Position,
                context: vscode.ReferenceContext,
                token: vscode.CancellationToken
            ): Promise<vscode.Location[] | undefined> {
                const wordRange = document.getWordRangeAtPosition(position);
                if (!wordRange) {
                    return undefined;
                }

                const methodName = document.getText(wordRange);

                // 현재 자바 파일의 인터페이스 이름 추출
                const fullText = document.getText();
                const interfaceMatch = fullText.match(REGEX.JAVA_INTERFACE_DECLARATION);
                let mapperTypeName = '';
                if (interfaceMatch) {
                    mapperTypeName = interfaceMatch[1];
                } else {
                    const path = require('path');
                    mapperTypeName = path.basename(document.fileName, '.java');
                }

                if (!mapperTypeName) {
                    return undefined;
                }

                // 프로젝트 전체 XML 파일 검색
                const xmlFiles = await vscode.workspace.findFiles('**/*.xml', '**/node_modules/**', 1000);
                const locations: vscode.Location[] = [];

                for (const fileUri of xmlFiles) {
                    try {
                        const xmlData = await vscode.workspace.fs.readFile(fileUri);
                        const xmlContent = new TextDecoder('utf-8').decode(xmlData);

                        // XML 내부 <mapper namespace="..."> 분석
                        const namespaceMatch = xmlContent.match(REGEX.XML_MAPPER_NAMESPACE);
                        if (namespaceMatch) {
                            const namespace = namespaceMatch[1];
                            // namespace가 mapperTypeName과 일치하거나 mapperTypeName으로 끝나는지 확인
                            if (namespace === mapperTypeName || namespace.endsWith('.' + mapperTypeName)) {
                                // XML 안에서 쿼리 ID 매치
                                const lines = xmlContent.split(/\r?\n/);
                                const idRegex = REGEX_FACTORY.createXmlQueryIdFinder(methodName);
                                
                                for (let i = 0; i < lines.length; i++) {
                                    if (idRegex.test(lines[i])) {
                                        const charIndex = lines[i].indexOf(methodName);
                                        const targetPosition = new vscode.Position(i, charIndex !== -1 ? charIndex : 0);
                                        locations.push(new vscode.Location(fileUri, targetPosition));
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // 개별 파일 읽기 에러 무시
                    }
                }

                return locations.length > 0 ? locations : undefined;
            }
        }
    );

    context.subscriptions.push(referenceProvider);
}

export function deactivate() {}
