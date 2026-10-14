package org.jhipster.blog.security;

import dev.openfga.OpenFgaExceptionHandler;
import dev.openfga.sdk.api.client.OpenFgaClient;
import dev.openfga.sdk.api.client.model.ClientTupleKey;
import dev.openfga.sdk.api.client.model.ClientTupleKeyWithoutCondition;
import dev.openfga.sdk.api.client.model.ClientWriteRequest;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Writes and deletes the relationship tuples that OpenFGA uses to decide who can access blogs and posts.
 */
@Component
public class FgaTuples {

    private final OpenFgaClient fgaClient;
    private final OpenFgaExceptionHandler exceptionHandler;

    public FgaTuples(OpenFgaClient fgaClient, OpenFgaExceptionHandler exceptionHandler) {
        this.fgaClient = fgaClient;
        this.exceptionHandler = exceptionHandler;
    }

    public void write(String user, String relation, String object) {
        try {
            fgaClient.writeTuples(List.of(new ClientTupleKey().user(user).relation(relation)._object(object))).get();
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error writing tuple %s %s %s", user, relation, object);
        }
    }

    public void delete(String user, String relation, String object) {
        try {
            fgaClient.deleteTuples(List.of(new ClientTupleKeyWithoutCondition().user(user).relation(relation)._object(object))).get();
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error deleting tuple %s %s %s", user, relation, object);
        }
    }

    /**
     * Replaces {@code oldUser} with {@code newUser} in one request, so OpenFGA makes both changes or neither.
     */
    public void replace(String oldUser, String newUser, String relation, String object) {
        try {
            fgaClient
                .write(
                    new ClientWriteRequest()
                        .writes(List.of(new ClientTupleKey().user(newUser).relation(relation)._object(object)))
                        .deletes(List.of(new ClientTupleKeyWithoutCondition().user(oldUser).relation(relation)._object(object)))
                )
                .get();
        } catch (Exception e) {
            throw exceptionHandler.handle(e, "Error replacing %s with %s in tuple %s %s", oldUser, newUser, relation, object);
        }
    }
}
