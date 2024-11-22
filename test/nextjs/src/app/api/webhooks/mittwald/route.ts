import "server-only";
import {CombinedWebhookHandlerFactory} from "@weissaufschwarz/mitthooks/index";
import type {ExtensionStorage, ExtensionToBeAdded, ExtensionToBeUpdated} from "@weissaufschwarz/mitthooks/storage/extensionStorage";
import {NextJSWebhookHandler} from "@weissaufschwarz/mitthooks-nextjs/index";

const extensionId = "5f5b7a5e-b46b-4efc-8747-9f08e933cc8b";

class FakeExtensionStorage implements ExtensionStorage {
    public async upsertExtension(extension: ExtensionToBeAdded): Promise<void> {
        console.log("successfully reached upsertExtension", extension);
    }

    public async updateExtension(extension: ExtensionToBeUpdated):Promise<void> {
        console.log("successfully reached updateExtension", extension);
    }

    public async rotateSecret(extensionInstanceId: string, secret: string):Promise<void> {
        console.log("successfully reached rotateSecret", extensionInstanceId, secret);
    }
    public async removeInstance(extensionInstanceId: string):Promise<void> {
        console.log("successfully reached removeInstance", extensionInstanceId);
    }
}

export async function POST(req: Request) {
  const combinedHandler = new CombinedWebhookHandlerFactory(new FakeExtensionStorage(), extensionId)
      .withMittwaldAPIURL("http://localhost:8080")
      .build();
  const handler = new NextJSWebhookHandler(combinedHandler);

  return handler.handleWebhook(req);
}

