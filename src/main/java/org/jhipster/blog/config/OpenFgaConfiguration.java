package org.jhipster.blog.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.openfga.sdk.api.client.OpenFgaClient;
import dev.openfga.sdk.api.model.CreateStoreRequest;
import dev.openfga.sdk.api.model.Store;
import dev.openfga.sdk.api.model.WriteAuthorizationModelRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

/**
 * Creates the OpenFGA store (if needed) and writes the authorization model from {@code fga/model.json} on startup.
 */
@Configuration
public class OpenFgaConfiguration {

    private static final Logger LOG = LoggerFactory.getLogger(OpenFgaConfiguration.class);
    private static final String STORE_NAME = "blog";

    @Bean
    public ApplicationRunner openFgaInitializer(OpenFgaClient fgaClient, @Value("classpath:fga/model.json") Resource model) {
        return args -> {
            String storeId = fgaClient
                .listStores()
                .get()
                .getStores()
                .stream()
                .filter(store -> STORE_NAME.equals(store.getName()))
                .map(Store::getId)
                .findFirst()
                .orElse(null);
            if (storeId == null) {
                storeId = fgaClient.createStore(new CreateStoreRequest().name(STORE_NAME)).get().getId();
            }
            fgaClient.setStoreId(storeId);
            var request = new ObjectMapper().readValue(model.getInputStream(), WriteAuthorizationModelRequest.class);
            String modelId = fgaClient.writeAuthorizationModel(request).get().getAuthorizationModelId();
            fgaClient.setAuthorizationModelId(modelId);
            LOG.info("Using OpenFGA store {} with authorization model {}", storeId, modelId);
        };
    }
}
